import WebSocket, { WebSocketServer } from 'ws';
import "dotenv/config";
import Todays from "../models/Todays.js";

// Store connected clients
const connectedClients = new Set();

// WebSocket server for client connections
let wss = null;

// Utility function to sanitize data and ensure it conforms to our schema
const sanitizeData = (data) => {
  if (!data) return null;

  try {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));

    // Handle nested objects that might cause schema validation issues
    if (sanitized.live) {
      // Handle commentaries
      if (Array.isArray(sanitized.live.commentaries)) {
        const sanitizedCommentaries = sanitized.live.commentaries.map(comment => {
          // Convert all fields to appropriate types
          return {
            event_id: String(comment.event_id || ''),
            event: String(comment.event || ''),
            batsman_id: String(comment.batsman_id || ''),
            bowler_id: String(comment.bowler_id || ''),
            over: String(comment.over || ''),
            ball: String(comment.ball || ''),
            score: comment.score, // Keep as mixed type
            commentary: String(comment.commentary || ''),
            noball_dismissal: Boolean(comment.noball_dismissal),
            text: String(comment.text || ''),
            timestamp: Number(comment.timestamp || 0),
            run: Number(comment.run || 0),
            noball_run: String(comment.noball_run || '0'),
            wide_run: String(comment.wide_run || '0'),
            bye_run: String(comment.bye_run || '0'),
            legbye_run: String(comment.legbye_run || '0'),
            bat_run: String(comment.bat_run || '0'),
            odds: comment.odds, // Keep as mixed type
            six: Boolean(comment.six),
            four: Boolean(comment.four),
            freehit: Boolean(comment.freehit),
            xball: Number(comment.xball || 0),
            wicket_batsman_id: String(comment.wicket_batsman_id || ''),
            how_out: String(comment.how_out || ''),
            batsman_runs: String(comment.batsman_runs || ''),
            batsman_balls: String(comment.batsman_balls || '')
          };
        });

        // Create a new object instead of modifying the existing one
        sanitized.live = {
          ...sanitized.live,
          commentaries: sanitizedCommentaries
        };
      }

      // Handle batsmen
      if (Array.isArray(sanitized.live.batsmen)) {
        const sanitizedBatsmen = sanitized.live.batsmen.map(batsman => {
          return {
            name: String(batsman.name || ''),
            batsman_id: Number(batsman.batsman_id || 0),
            runs: Number(batsman.runs || 0),
            balls_faced: Number(batsman.balls_faced || 0),
            fours: Number(batsman.fours || 0),
            sixes: Number(batsman.sixes || 0),
            strike_rate: String(batsman.strike_rate || '')
          };
        });

        // Create a new object instead of modifying the existing one
        sanitized.live = {
          ...sanitized.live,
          batsmen: sanitizedBatsmen
        };
      }

      // Handle bowlers
      if (Array.isArray(sanitized.live.bowlers)) {
        const sanitizedBowlers = sanitized.live.bowlers.map(bowler => {
          return {
            name: String(bowler.name || ''),
            bowler_id: Number(bowler.bowler_id || 0),
            overs: Number(bowler.overs || 0),
            runs_conceded: Number(bowler.runs_conceded || 0),
            wickets: Number(bowler.wickets || 0),
            maidens: Number(bowler.maidens || 0),
            econ: String(bowler.econ || '')
          };
        });

        // Create a new object instead of modifying the existing one
        sanitized.live = {
          ...sanitized.live,
          bowlers: sanitizedBowlers
        };
      }
    }

    return sanitized;
  } catch (error) {
    console.error('Error in sanitizeData:', error);
    // Return a safe fallback
    return data;
  }
};

// WebSocket connection to third-party API
const connectToThirdPartySocket = () => {
  const wsUrl = process.env.ENT_WS_URL;

  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('Connected to Entity WebSocket...');
  });

  ws.on('message', async (data) => {
    try {
      // Parse incoming data
      const parsedData = JSON.parse(data.toString());
      // console.log("-----------------------------------------------------------------")
      // console.log('Received data from third-party WebSocket:');
      // if (parsedData && parsedData.api_type) {
      //   console.log("api type", parsedData.api_type, parsedData.response?.match_id);
      // }
      // if (parsedData && parsedData.response?.ball_event) {
      //   console.log("ball event", parsedData.response.ball_event, parsedData.response?.match_id);
      // }

      // Process the data based on the event type
      if (parsedData && parsedData.api_type == "match_push_obj" && parsedData.response?.match_id) {
        try {
          // Sanitize the data before processing
          const sanitizedData = sanitizeData(parsedData.response);

          if (sanitizedData) {
            // Update the database with the sanitized data
            await updateMatchData(sanitizedData);

            // Forward the sanitized data to all connected clients
            broadcastToClients({
              type: 'match_update',
              data: sanitizedData
            });
          }

        } catch (updateError) {
          console.error('Error processing match update:', updateError);
          console.error('Error stack:', updateError.stack);
          console.error('Problematic data structure:', JSON.stringify({
            match_id: parsedData.response?.match_id,
            has_live: !!parsedData.response?.live,
            has_commentaries: !!(parsedData.response?.live?.commentaries),
            commentaries_length: parsedData.response?.live?.commentaries?.length || 0,
            live_type: typeof parsedData.response?.live,
            live_keys: parsedData.response?.live ? Object.keys(parsedData.response.live) : []
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      // Log the raw data for debugging
      try {
        console.error('Raw data preview:', data.toString().substring(0, 200) + '...');
      } catch (logError) {
        console.error('Could not log raw data');
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    // Reconnect after a delay
    setTimeout(connectToThirdPartySocket, 5000);
  });

  ws.on('close', () => {
    console.log('Third-party WebSocket connection closed');
    // Reconnect after a delay
    setTimeout(connectToThirdPartySocket, 5000);
  });

  return ws;
};

// Update match data in the database
const updateMatchData = async (data) => {
  try {
    if (!data || !data.match_id) {
      console.error('Invalid match data received');
      return;
    }

    // First, check if the existing document has live as a string and convert it
    const existingMatch = await Todays.findOne({ match_id: data.match_id });
    if (existingMatch && typeof existingMatch.live === 'string') {
      // Convert the string live field to an object structure
      await Todays.updateOne(
        { match_id: data.match_id },
        {
          $unset: { live: "" },
          $set: {
            live: {
              mid: data.match_id,
              status: 0,
              status_str: '',
              game_state: 0,
              game_state_str: '',
              status_note: existingMatch.live || '',
              team_batting: '',
              team_bowling: '',
              live_inning_number: 0,
              live_score: {
                runs: 0,
                overs: 0,
                wickets: 0,
                target: 0,
                runrate: 0,
                required_runrate: ''
              },
              batsmen: [],
              bowlers: [],
              commentaries: [],
              live_inning: {}
            }
          }
        }
      );
    }

    // Handle commentaries separately if they exist
    if (data.live && data.live.commentaries) {
      // Ensure commentaries are in the expected format
      const formattedCommentaries = data.live.commentaries.map(commentary => {
        return {
          event_id: commentary.event_id?.toString() || '',
          event: commentary.event?.toString() || '',
          batsman_id: commentary.batsman_id?.toString() || '',
          bowler_id: commentary.bowler_id?.toString() || '',
          over: commentary.over?.toString() || '',
          ball: commentary.ball?.toString() || '',
          score: commentary.score !== undefined ? commentary.score : 0,
          commentary: commentary.commentary?.toString() || '',
          noball_dismissal: Boolean(commentary.noball_dismissal),
          text: commentary.text?.toString() || '',
          timestamp: commentary.timestamp || 0,
          run: commentary.run || 0,
          noball_run: commentary.noball_run?.toString() || '0',
          wide_run: commentary.wide_run?.toString() || '0',
          bye_run: commentary.bye_run?.toString() || '0',
          legbye_run: commentary.legbye_run?.toString() || '0',
          bat_run: commentary.bat_run?.toString() || '0',
          odds: commentary.odds,
          six: Boolean(commentary.six),
          four: Boolean(commentary.four),
          freehit: Boolean(commentary.freehit),
          xball: commentary.xball || 0,
          wicket_batsman_id: commentary.wicket_batsman_id?.toString() || '',
          how_out: commentary.how_out?.toString() || '',
          batsman_runs: commentary.batsman_runs?.toString() || '',
          batsman_balls: commentary.batsman_balls?.toString() || ''
        };
      });

      // Update just the commentaries
      if (formattedCommentaries.length > 0) {
        await Todays.updateOne(
          { match_id: data.match_id },
          { $set: { 'live.commentaries': formattedCommentaries } }
        );
      }

      // Remove commentaries from the data to avoid duplicate processing
      const dataWithoutCommentaries = { ...data };
      if (dataWithoutCommentaries.live) {
        delete dataWithoutCommentaries.live.commentaries;
      }

      // Update the rest of the data
      await Todays.updateOne(
        { match_id: data.match_id },
        { $set: dataWithoutCommentaries },
        { upsert: true }
      );
    } else {
      // If no commentaries, just update the data directly
      await Todays.updateOne(
        { match_id: data.match_id },
        { $set: data },
        { upsert: true }
      );
    }

    console.log(`Updated match data for match ID: ${data.match_id}`);
  } catch (error) {
    console.error(`Error updating match data: ${error.message}`);
    // Log more details about the error
    if (error.name === 'CastError') {
      console.error(`Cast error details: ${JSON.stringify({
        path: error.path,
        kind: error.kind,
        value: error.value ? typeof error.value : 'unknown'
      })}`);
    }
  }
};

// Set up WebSocket server for client connections
const setupWebSocketServer = (port) => {
  // Create WebSocket server directly
  wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    console.log('Client connected:', req.socket.remoteAddress);
    connectedClients.add(ws);

    // Send current match data to the newly connected client
    sendCurrentMatchData(ws);

    ws.on('close', () => {
      console.log('Client disconnected');
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      connectedClients.delete(ws);
    });

    // Handle incoming messages from clients
    ws.on('message', (message) => {
      console.log('Received message from client:', message.toString());
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        console.error('Error parsing client message:', error);
      }
    });
  });

  console.log(`[WEBSOCKET] : Live @ ${port}`);
  return wss;
};

// Handle client messages
const handleClientMessage = (ws, data) => {
  switch (data.type) {
    case 'subscribePortfolio':
      // Handle portfolio subscription
      handlePortfolioSubscription(ws, data);
      break;
    case 'unsubscribePortfolio':
      // Handle portfolio unsubscription
      handlePortfolioUnsubscription(ws, data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
};

// Handle portfolio subscription
const handlePortfolioSubscription = async (ws, data) => {
  try {
    // Store subscription info
    ws.subscriptionType = 'portfolio';
    ws.userId = data.userId;

    // Send initial portfolio data
    await sendPortfolioData(ws);
  } catch (error) {
    console.error('Error handling portfolio subscription:', error);
  }
};

// Handle portfolio unsubscription
const handlePortfolioUnsubscription = (ws, data) => {
  ws.subscriptionType = null;
  ws.userId = null;
  console.log('Client unsubscribed from portfolio updates');
};

// Broadcast to all connected clients
const broadcastToClients = (data) => {
  connectedClients.forEach((client) => {
    console.log("broadcasted to connected client")
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Broadcast to specific user's portfolio clients
const broadcastToPortfolioClients = (userId, data) => {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN &&
      client.subscriptionType === 'portfolio' &&
      client.userId === userId) {
      client.send(JSON.stringify(data));
    }
  });
};

// Send current match data to a client
const sendCurrentMatchData = async (ws) => {
  try {
    const matches = await Todays.find({}).lean();

    if (matches && matches.length > 0) {
      ws.send(JSON.stringify({
        type: 'initial_matches',
        data: matches
      }));
    }
  } catch (error) {
    console.error(`Error sending current match data: ${error.message}`);
  }
};

// Send portfolio data to a client
const sendPortfolioData = async (ws) => {
  try {
    if (!ws.userId) {
      console.warn('No user ID found for portfolio data request');
      return;
    }

    // Get user's portfolio data (you'll need to implement this)
    const portfolioData = await getUserPortfolioData(ws.userId);

    ws.send(JSON.stringify({
      type: 'portfolio_update',
      data: portfolioData
    }));
  } catch (error) {
    console.error(`Error sending portfolio data: ${error.message}`);
  }
};

// Helper function to get user portfolio data
const getUserPortfolioData = async (userId) => {
  // Implement this based on your existing portfolio logic
  // This should return the same structure as your current portfolio data
  return {};
};

export {
  connectToThirdPartySocket,
  setupWebSocketServer,
  broadcastToPortfolioClients
}; 
