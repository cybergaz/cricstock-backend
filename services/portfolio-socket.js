import { User } from "../models/User.js";
import Scorecards from "../models/Scorecards.js";
import socketAuthMiddleware from "./socket-auth.js";

// Store connected clients and their subscriptions
const portfolioSubscriptions = new Map();
let portfolioNamespace = null;

/**
 * Setup portfolio WebSocket handlers on the provided Socket.io server
 * @param {Server} io - The Socket.io server instance
 */
const setupPortfolioSockets = (io) => {
  // Create a separate namespace for portfolio sockets with authentication
  portfolioNamespace = io.of('/portfolio');
  
  // Apply authentication middleware to portfolio namespace
  portfolioNamespace.use(socketAuthMiddleware);
  
  // Handle client connections to portfolio namespace
  portfolioNamespace.on('connection', (socket) => {
    console.log('Client connected to portfolio socket:', socket.id);
    
    // Handle authentication errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error.message);
    });
    
    // Handle portfolio subscription
    socket.on('subscribePortfolio', async () => {
      try {
        console.log(`Client ${socket.id} subscribed to portfolio updates for user ${socket.userId}`);
        
        // Store the subscription with user ID
        portfolioSubscriptions.set(socket.id, {
          type: 'portfolio',
          userId: socket.userId,
          lastUpdate: Date.now()
        });
        
        // Send initial portfolio data
        await sendPortfolioData(socket);
      } catch (error) {
        console.error(`Error handling portfolio subscription: ${error.message}`);
      }
    });
    
    // Handle portfolio unsubscription
    socket.on('unsubscribePortfolio', () => {
      console.log(`Client ${socket.id} unsubscribed from portfolio updates`);
      portfolioSubscriptions.delete(socket.id);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Portfolio client disconnected:', socket.id);
      portfolioSubscriptions.delete(socket.id);
    });
  });
  
  // Set up periodic updates for all subscribed clients
  setInterval(async () => {
    try {
      // Get all clients subscribed to portfolio updates
      for (const [socketId, subscription] of portfolioSubscriptions.entries()) {
        if (subscription.type === 'portfolio') {
          const socket = portfolioNamespace.sockets.sockets.get(socketId);
          if (socket) {
            await sendPortfolioData(socket);
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
 * Send portfolio data to a specific client
 * @param {Socket} socket - The client socket
 */
const sendPortfolioData = async (socket) => {
  try {
    // Get user ID from socket (authentication middleware sets this)
    const userId = socket.userId;
    
    if (!userId) {
      console.warn(`No user ID found for socket ${socket.id}`);
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
    socket.emit('portfolio_update', {
      playerPortfolios,
      teamPortfolios,
      playerHistory,
      teamHistory,
      availableBalance: user.amount,
      totalProfit: user.totalProfit || 0,
      matchData
    });
    
    // Update last update timestamp
    const subscription = portfolioSubscriptions.get(socket.id);
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
    // Find all sockets subscribed to this user's portfolio
    for (const [socketId, subscription] of portfolioSubscriptions.entries()) {
      if (subscription.type === 'portfolio' && subscription.userId === userId) {
        const socket = portfolioNamespace.sockets.sockets.get(socketId);
        if (socket) {
          if (data) {
            // Send specific data if provided
            socket.emit('portfolio_update', data);
          } else {
            // Otherwise send full portfolio data
            await sendPortfolioData(socket);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error broadcasting portfolio update: ${error.message}`);
  }
};

export { setupPortfolioSockets, broadcastPortfolioUpdate }; 