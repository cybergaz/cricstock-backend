import axios from 'axios';
import WebSocket from 'ws';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scorecards from '../models/Scorecards.js';
import { calculatePlayerPrice } from '../services/stock-price-service.js';

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
async function testPlayerPrices() {
  try {
    console.log(`Fetching current player prices for match ${MATCH_ID}...`);

    // Get scorecard directly from database
    const scorecard = await Scorecards.findOne({ match_id: MATCH_ID });

    if (scorecard && scorecard.innings && scorecard.innings.length > 0) {
      // Check if we have batsmen data
      let hasBatsmen = false;
      let totalBatsmen = 0;

      for (const inning of scorecard.innings) {
        if (inning.batsmen && inning.batsmen.length > 0) {
          hasBatsmen = true;
          totalBatsmen += inning.batsmen.length;

          console.log(`\nInning ${inning.number} - ${inning.name || 'Unknown'}`);
          console.log('--------------------------------------------------');

          // Display player prices
          inning.batsmen.forEach((batsman, index) => {
            const currentPrice = batsman.currentPrice || 0;
            console.log(`${batsman.name} (${batsman.batsman_id}): ₹${currentPrice.toFixed(2)}`);

            // Verify the price calculation
            const calculatedPrice = calculatePlayerPrice(batsman, index);
            if (Math.abs(currentPrice - calculatedPrice) > 0.01) {
              console.log(`  ⚠️ Price mismatch! Calculated: ₹${calculatedPrice.toFixed(2)}`);
            }
          });
        }
      }

      if (!hasBatsmen) {
        console.log('No batsmen data found in the scorecard');
      } else {
        console.log(`\nTotal batsmen: ${totalBatsmen}`);
      }

      return scorecard;
    } else {
      console.error('No scorecard or innings found for this match');
      return null;
    }
  } catch (error) {
    console.error('Error fetching player prices:', error);
    return null;
  }
}

async function testUpdatePlayerPrices() {
  try {
    console.log(`\nUpdating player prices for match ${MATCH_ID}...`);

    // Get scorecard directly from database
    const scorecard = await Scorecards.findOne({ match_id: MATCH_ID });

    if (!scorecard || !scorecard.innings || scorecard.innings.length === 0) {
      console.error('No scorecard or innings found for this match');
      return null;
    }

    // Update player prices for testing
    let updated = false;

    for (let i = 0; i < scorecard.innings.length; i++) {
      if (!scorecard.innings[i].batsmen || scorecard.innings[i].batsmen.length === 0) continue;

      for (let j = 0; j < scorecard.innings[i].batsmen.length; j++) {
        const batsman = scorecard.innings[i].batsmen[j];

        // Simulate a run scored to update the price
        if (batsman.runs) {
          const currentRuns = Number(batsman.runs) || 0;
          batsman.runs = String(currentRuns + 1);

          // Update fours or sixes for more price impact
          if (j % 2 === 0) {
            const currentFours = Number(batsman.fours) || 0;
            batsman.fours = String(currentFours + 1);
          } else {
            const currentSixes = Number(batsman.sixes) || 0;
            batsman.sixes = String(currentSixes + 1);
          }

          // Calculate new price
          const newPrice = calculatePlayerPrice(batsman, j);
          scorecard.innings[i].batsmen[j].currentPrice = newPrice;

          console.log(`Updated ${batsman.name}: runs=${batsman.runs}, fours=${batsman.fours}, sixes=${batsman.sixes}, price=₹${newPrice.toFixed(2)}`);
          updated = true;

          // Only update one player for testing
          break;
        }
      }

      if (updated) break;
    }

    if (updated) {
      await scorecard.save();
      console.log('Saved updated player prices to database');
      return scorecard;
    } else {
      console.log('No players were updated (no batsmen with runs found)');
      return null;
    }
  } catch (error) {
    console.error('Error updating player prices:', error);
    return null;
  }
}

async function listenToWebSocketUpdates() {
  return new Promise((resolve) => {
    console.log('\nConnecting to WebSocket to listen for player price updates...');
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      console.log('WebSocket connected, waiting for updates...');
      // Set a timeout to close the connection after 15 seconds if no relevant updates
      setTimeout(() => {
        console.log('No relevant updates received in 15 seconds, closing connection');
        ws.close();
        resolve({ received: false });
      }, 15000);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        // Check if this is a match update for our match ID with player prices
        if (message.type === 'match_update' &&
          message.data &&
          message.data.match_id === MATCH_ID &&
          message.data.scorecard) {

          let foundPlayerPrices = false;
          let playerPrices = [];

          // Check if the update contains player prices
          if (message.data.scorecard.innings) {
            for (const inning of message.data.scorecard.innings) {
              if (inning.batsmen) {
                for (const batsman of inning.batsmen) {
                  if (batsman.currentPrice !== undefined) {
                    foundPlayerPrices = true;
                    playerPrices.push({
                      name: batsman.name,
                      id: batsman.batsman_id,
                      price: batsman.currentPrice
                    });
                  }
                }
              }
            }
          }

          if (foundPlayerPrices) {
            console.log('Received match update with player prices:');
            playerPrices.forEach(player => {
              console.log(`  ${player.name}: ₹${player.price.toFixed(2)}`);
            });

            ws.close();
            resolve({ received: true, playerPrices });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      resolve({ received: false });
    });
  });
}

// Run tests
async function runTests() {
  console.log('=== Testing Player Price Functionality ===');

  await connectToDatabase();

  // Step 1: Check current player prices
  console.log('\n1. Checking current player prices...');
  const initialData = await testPlayerPrices();

  if (!initialData) {
    console.error('Failed to get initial player prices. Aborting tests.');
    mongoose.disconnect();
    return;
  }

  // Step 2: Update player prices
  console.log('\n2. Updating player prices...');
  const updatedData = await testUpdatePlayerPrices();

  if (!updatedData) {
    console.error('Failed to update player prices. Aborting tests.');
    mongoose.disconnect();
    return;
  }

  // Step 3: Verify the update was successful
  console.log('\n3. Verifying player prices were updated...');
  const verificationData = await testPlayerPrices();

  if (!verificationData) {
    console.error('Failed to verify player prices.');
    mongoose.disconnect();
    return;
  }

  // Step 4: Listen for WebSocket updates
  console.log('\n4. Listening for WebSocket updates...');
  const wsResult = await listenToWebSocketUpdates();

  console.log('\n=== Test Results ===');
  console.log('Player prices updated in database:', updatedData ? 'Yes' : 'No');
  console.log('WebSocket update received:', wsResult.received ? 'Yes' : 'No');

  if (wsResult.received) {
    console.log('\n✅ Player prices were successfully updated and broadcast!');
  } else {
    console.log('\n❌ Player price updates were not broadcast via WebSocket.');
    console.log('This could be because:');
    console.log('1. The WebSocket server is not running');
    console.log('2. The match data is not being updated in real-time');
    console.log('3. The player price updates are not being included in the broadcast');
  }

  console.log('\nTest completed.');
  mongoose.disconnect();
}

runTests().catch(console.error); 
