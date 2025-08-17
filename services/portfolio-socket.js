import { User } from "../models/User.js";
import Scorecards from "../models/Scorecards.js";
import WebSocket, { WebSocketServer } from 'ws';

// Store connected clients and their subscriptions
const portfolioSubscriptions = new Map();

/**
 * Setup portfolio WebSocket handlers on the provided WebSocket server
 * @param {WebSocket.Server} wss - The WebSocket server instance
 */
const setupPortfolioSockets = (wss) => {
  // Handle client connections
  wss.on('connection', (ws, req) => {
    console.log('Client connected to portfolio socket:', req.socket.remoteAddress);

    // Handle portfolio subscription
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'subscribePortfolio':
            await handlePortfolioSubscription(ws, data);
            break;
          case 'unsubscribePortfolio':
            handlePortfolioUnsubscription(ws, data);
            break;
          case 'authenticate':
            await handleAuthentication(ws, data);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling portfolio message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('Portfolio client disconnected');
      portfolioSubscriptions.delete(ws.id);
    });
  });

  // Set up periodic updates for all subscribed clients
  setInterval(async () => {
    try {
      // Get all clients subscribed to portfolio updates
      for (const [socketId, subscription] of portfolioSubscriptions.entries()) {
        if (subscription.type === 'portfolio') {
          const ws = subscription.ws;
          if (ws.readyState === WebSocket.OPEN) {
            await sendPortfolioData(ws);
          } else {
            // Clean up if socket no longer exists
            portfolioSubscriptions.delete(socketId);
          }
        }
      }
    } catch (error) {
      console.error(`Error in portfolio update interval: ${error.message}`);
    }
  }, 2000); // Update every 2 seconds
};

/**
 * Handle authentication for portfolio clients
 * @param {WebSocket} ws - The client WebSocket
 * @param {Object} data - Authentication data
 */
const handleAuthentication = async (ws, data) => {
  try {
    const { token } = data;

    if (!token) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication token not provided'
      }));
      return;
    }

    // Verify JWT token (you'll need to implement this)
    const user = await verifyToken(token);
    if (!user) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
      return;
    }

    // Store user info on the WebSocket
    ws.userId = user._id;
    ws.user = user;

    ws.send(JSON.stringify({
      type: 'auth_success',
      userId: user._id
    }));

  } catch (error) {
    console.error('Authentication error:', error);
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Authentication failed'
    }));
  }
};

/**
 * Handle portfolio subscription
 * @param {WebSocket} ws - The client WebSocket
 * @param {Object} data - Subscription data
 */
const handlePortfolioSubscription = async (ws, data) => {
  try {
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication required'
      }));
      return;
    }

    console.log(`Client ${ws.id} subscribed to portfolio updates for user ${ws.userId}`);

    // Store the subscription
    portfolioSubscriptions.set(ws.id, {
      type: 'portfolio',
      userId: ws.userId,
      ws: ws,
      lastUpdate: Date.now()
    });

    // Send initial portfolio data
    await sendPortfolioData(ws);
  } catch (error) {
    console.error(`Error handling portfolio subscription: ${error.message}`);
  }
};

/**
 * Handle portfolio unsubscription
 * @param {WebSocket} ws - The client WebSocket
 * @param {Object} data - Unsubscription data
 */
const handlePortfolioUnsubscription = (ws, data) => {
  console.log(`Client ${ws.id} unsubscribed from portfolio updates`);
  portfolioSubscriptions.delete(ws.id);
};

/**
 * Send portfolio data to a specific client
 * @param {WebSocket} ws - The client WebSocket
 */
const sendPortfolioData = async (ws) => {
  try {
    const userId = ws.userId;

    if (!userId) {
      console.warn(`No user ID found for WebSocket`);
      return;
    }

    // Get user's portfolio data
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User not found for ID: ${userId}`);
      return;
    }

    // Extract active portfolios
    const playerPortfolios = user.playerPortfolios.filter(p => p.status === "Buy");
    const teamPortfolios = user.teamPortfolios.filter(p => p.status === "Buy");

    // Get portfolio history
    const playerHistory = user.playerPortfolios.filter(p => p.status === "Sold");
    const teamHistory = user.teamPortfolios.filter(p => p.status === "Sold");

    // Collect unique match IDs to fetch match data
    const uniqueMatchIds = Array.from(new Set([
      ...playerPortfolios.map(p => p.matchId),
      ...teamPortfolios.map(p => p.matchId)
    ]));

    // Fetch match data for all relevant matches
    const matchData = {};
    if (uniqueMatchIds.length > 0) {
      const scorecards = await Scorecards.find({ match_id: { $in: uniqueMatchIds } });
      scorecards.forEach(scorecard => {
        matchData[scorecard.match_id] = scorecard;
      });
    }

    // Send the portfolio data to the client
    ws.send(JSON.stringify({
      type: 'portfolio_update',
      data: {
        playerPortfolios,
        teamPortfolios,
        playerHistory,
        teamHistory,
        availableBalance: user.amount,
        totalProfit: user.totalProfit || 0,
        matchData
      }
    }));

    // Update last update timestamp
    const subscription = portfolioSubscriptions.get(ws.id);
    if (subscription) {
      subscription.lastUpdate = Date.now();
    }

  } catch (error) {
    console.error(`Error sending portfolio data: ${error.message}`);
  }
};

/**
 * Broadcast portfolio update to a specific user
 * @param {string} userId - The user ID to send update to
 * @param {Object} data - Optional specific data to send
 */
const broadcastPortfolioUpdate = async (userId, data = null) => {
  try {
    // Find all WebSockets subscribed to this user's portfolio
    for (const [socketId, subscription] of portfolioSubscriptions.entries()) {
      if (subscription.type === 'portfolio' && subscription.userId === userId) {
        const ws = subscription.ws;
        if (ws.readyState === WebSocket.OPEN) {
          if (data) {
            // Send specific data if provided
            ws.send(JSON.stringify({
              type: 'portfolio_update',
              data: data
            }));
          } else {
            // Otherwise send full portfolio data
            await sendPortfolioData(ws);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error broadcasting portfolio update: ${error.message}`);
  }
};

// Helper function to verify JWT token
const verifyToken = async (token) => {
  try {
    // Implement JWT verification here
    // You can use the same logic from your socket-auth.js
    return null; // Placeholder
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

export { setupPortfolioSockets, broadcastPortfolioUpdate }; 
