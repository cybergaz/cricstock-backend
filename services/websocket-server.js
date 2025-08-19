import WebSocket, { WebSocketServer } from 'ws';
import "dotenv/config";
import Todays from "../models/Todays.js";
import { generateUniqueId, verifyToken } from "./utils.js";
import { sendCurrentMatchData, sendCurrentPortfolioData } from "./socket-services.js";
import Scorecards from "../models/Scorecards.js";
import { processMatchEvents } from "./stock-price-service.js";

// Store connected clients
const subscribedClients = new Map();

// WebSocket server for client connections
let wss = null;

const setupWebSocketServer = (port) => {

  // Create WebSocket server directly
  wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    ws.id = generateUniqueId();
    console.log('Client connected:', ws.id);

    ws.on('close', () => {
      console.log('Client disconnected');
      subscribedClients.delete(ws.id);
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      subscribedClients.delete(ws.id);
    });

    // Handle incoming messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message from client:', data);
        // main websocker handler
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
    case 'subscribe_match':
      // Handle portfolio subscription
      handleMatchSubscription(ws, data);
      break;
    case 'unsubscribe_match':
      // Handle portfolio unsubscription
      handleMatchUnsubscription(ws, data);
      break;
    case 'subscribe_portfolio':
      // Handle portfolio subscription
      handlePortfolioSubscription(ws, data);
      break;
    case 'unsubscribe_portfolio':
      // Handle portfolio unsubscription
      handlePortfolioUnsubscription(ws, data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
};

const handleMatchSubscription = async (ws, data) => {
  try {
    // Store subscription info
    subscribedClients.set(ws.id, {
      type: 'match_update',
      user_id: ws.userId || null,
      match_id: data.match_id || null,
      ws: ws,
      lastUpdate: Date.now()
    });

    ws.send(JSON.stringify({ type: 'match_subscription_success', message: `Subscribed to match (${data.match_id}) updates` }));
    console.log('Client subscribed to match updates:', data.match_id);

    // Send current match data to the newly connected client
    sendCurrentMatchData(ws);
  } catch (error) {
    console.error('Error handling portfolio subscription:', error);
  }
};

// Handle portfolio subscription
const handlePortfolioSubscription = async (ws, data) => {
  console.log('client is trying to subscribe to portfolio updates', data);
  try {

    const { token } = data;

    if (!token) {
      ws.send(JSON.stringify({
        type: 'subscription_error',
        message: 'Authentication token not provided'
      }));
      return;
    }

    // Verify JWT token
    const user = await verifyToken(token);
    if (!user) {
      ws.send(JSON.stringify({
        type: 'subscription_error',
        message: 'Authentication failed: no user found for token'
      }));
      return;
    }

    // Store user info on the WebSocket
    ws.userId = user._id;

    // Store subscription info
    subscribedClients.set(ws.id, {
      type: 'portfolio_update',
      user_id: ws.userId || null,
      match_id: data.match_id || null,
      ws: ws,
      lastUpdate: Date.now()
    });

    ws.send(JSON.stringify({ type: 'portfolio_subscription_success', message: `Subscribed to user portfolio (${user.name}) updates` }));
    console.log('Client subscribed to portfolio updates:', data.match_id);

    // Send initial portfolio data
    await sendCurrentPortfolioData(ws);
  } catch (error) {
    console.error('Error handling portfolio subscription:', error);
    ws.send(JSON.stringify({
      type: 'subscription_error',
      message: 'Error subscribing to portfolio updates'
    }));
  }
};

const handleMatchUnsubscription = (ws, data) => {
  ws.userId = null;
  subscribedClients.delete(ws.id);
  console.log('Client unsubscribed from portfolio updates');
};

// Handle portfolio unsubscription
const handlePortfolioUnsubscription = (ws, data) => {
  ws.userId = null;
  subscribedClients.delete(ws.id);
  console.log('Client unsubscribed from portfolio updates');
};

// Broadcast to all connected clients
const broadcastToClients = (data) => {
  subscribedClients.forEach((client, id) => {
    // if (client.ws.readyState === WebSocket.OPEN && (String(client.match_id) === String(data.data.match_id) || String(client.user_id) === String(data.data.match_id))) {
    if (client.ws.readyState === WebSocket.OPEN) {
      console.log("sent match updates to subscribed client", client.ws.id, " for match ", data.match_id);
      client.ws.send(JSON.stringify(data));
    }
  });
};

export { setupWebSocketServer, broadcastToClients, handleClientMessage, handleMatchSubscription, handleMatchUnsubscription, handlePortfolioSubscription, handlePortfolioUnsubscription, subscribedClients, wss };
