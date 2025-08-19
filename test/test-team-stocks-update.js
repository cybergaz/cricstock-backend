import axios from 'axios';
import WebSocket from 'ws';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scorecards from '../models/Scorecards.js';

dotenv.config();

// Configuration
const API_BASE_URL = 'http://localhost:5001'; // Update with your server port
const WS_URL = 'ws://localhost:3001'; // WebSocket server URL
const MATCH_ID = '91874'; // Update with a real match ID

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test functions
async function testTeamStockPrices() {
  try {
    console.log(`Fetching current team stock prices for match ${MATCH_ID}...`);
    
    // Get scorecard directly from database
    const scorecard = await Scorecards.findOne({ match_id: MATCH_ID });
    
    if (scorecard) {
      console.log('Current team stock prices:', scorecard.teamStockPrices || 'Not set');
      return scorecard;
    } else {
      console.error('No scorecard found for this match');
      return null;
    }
  } catch (error) {
    console.error('Error fetching team stock prices:', error);
    return null;
  }
}

async function testUpdateTeamStockPrices() {
  try {
    console.log(`Updating team stock prices for match ${MATCH_ID}...`);
    
    // Generate random price changes
    const teamAPrice = 40 + Math.random() * 20; // Random price between 40-60
    const teamBPrice = 40 + Math.random() * 20; // Random price between 40-60
    
    const response = await axios.post(`${API_BASE_URL}/cricket/update-team-stocks/${MATCH_ID}`, {
      teamAPrice: teamAPrice.toFixed(2),
      teamBPrice: teamBPrice.toFixed(2)
    });
    
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating team stock prices:', error.response?.data || error.message);
    return null;
  }
}

async function listenToWebSocketUpdates() {
  return new Promise((resolve) => {
    console.log('Connecting to WebSocket to listen for updates...');
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('WebSocket connected, waiting for updates...');
      // Set a timeout to close the connection after 10 seconds if no relevant updates
      setTimeout(() => {
        console.log('No relevant updates received in 10 seconds, closing connection');
        ws.close();
        resolve(false);
      }, 10000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        // Check if this is a match update for our match ID
        if (message.type === 'match_update' && message.data && message.data.match_id === MATCH_ID) {
          console.log('Received match update with team stock prices:', message.data.teamStockPrices);
          ws.close();
          resolve(true);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      resolve(false);
    });
  });
}

// Run tests
async function runTests() {
  console.log('=== Testing Team Stock Price Functionality ===');
  
  await connectToDatabase();
  
  // Step 1: Check current team stock prices
  console.log('\n1. Checking current team stock prices...');
  const initialData = await testTeamStockPrices();
  
  if (!initialData) {
    console.error('Failed to get initial team stock prices. Aborting tests.');
    mongoose.disconnect();
    return;
  }
  
  // Step 2: Update team stock prices
  console.log('\n2. Updating team stock prices...');
  const updateResult = await testUpdateTeamStockPrices();
  
  if (!updateResult || !updateResult.success) {
    console.error('Failed to update team stock prices. Aborting tests.');
    mongoose.disconnect();
    return;
  }
  
  // Step 3: Verify the update was successful
  console.log('\n3. Verifying team stock prices were updated...');
  const updatedData = await testTeamStockPrices();
  
  if (!updatedData) {
    console.error('Failed to get updated team stock prices.');
    mongoose.disconnect();
    return;
  }
  
  // Step 4: Listen for WebSocket updates
  console.log('\n4. Listening for WebSocket updates...');
  const receivedUpdate = await listenToWebSocketUpdates();
  
  console.log('\n=== Test Results ===');
  console.log('Initial team stock prices:', initialData.teamStockPrices || 'Not set');
  console.log('Updated team stock prices:', updatedData.teamStockPrices || 'Not set');
  console.log('WebSocket update received:', receivedUpdate ? 'Yes' : 'No');
  
  if (updatedData.teamStockPrices && 
      initialData.teamStockPrices && 
      (updatedData.teamStockPrices.teama !== initialData.teamStockPrices.teama || 
       updatedData.teamStockPrices.teamb !== initialData.teamStockPrices.teamb)) {
    console.log('\n✅ Team stock prices were successfully updated!');
  } else {
    console.log('\n❌ Team stock prices were not updated correctly.');
  }
  
  if (receivedUpdate) {
    console.log('✅ WebSocket update was successfully received!');
  } else {
    console.log('❌ WebSocket update was not received.');
  }
  
  console.log('\nTest completed.');
  mongoose.disconnect();
}

runTests().catch(console.error); 