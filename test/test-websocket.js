import { connectToThirdPartySocket } from '../services/websocket-client.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

console.log('Starting WebSocket test...');
console.log('Connecting to MongoDB...');

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Connect to third-party WebSocket
    console.log('Connecting to third-party WebSocket...');
    const ws = connectToThirdPartySocket();
    
    console.log('WebSocket connection initiated');
    console.log('Waiting for messages... (Press Ctrl+C to exit)');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('Closing WebSocket connection...');
      if (ws && ws.readyState === 1) {
        ws.close();
      }
      mongoose.disconnect().then(() => {
        console.log('MongoDB disconnected');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 