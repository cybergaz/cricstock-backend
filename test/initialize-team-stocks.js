import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scorecards from '../models/Scorecards.js';

dotenv.config();

// Configuration
const API_BASE_URL = 'http://localhost:5001'; // Update with your server port
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

// Initialize team stock prices
async function initializeTeamStockPrices() {
  try {
    console.log(`Initializing team stock prices for match ${MATCH_ID}...`);
    
    // Check if scorecard exists
    let scorecard = await Scorecards.findOne({ match_id: MATCH_ID });
    
    if (!scorecard) {
      console.log('No scorecard found, creating a new one...');
      
      // Fetch match data to get team information
      const response = await axios.get(`${API_BASE_URL}/cricket/match/${MATCH_ID}`);
      
      if (!response.data.success) {
        console.error('Error fetching match data:', response.data.message);
        return;
      }
      
      const matchData = response.data.data.response;
      
      // Create a new scorecard with default values
      scorecard = new Scorecards({
        match_id: MATCH_ID,
        teamStockPrices: {
          teama: 50,
          teamb: 50
        },
        innings: []
      });
      
      await scorecard.save();
      console.log('Created new scorecard with default team stock prices');
    } else {
      console.log('Scorecard found, updating team stock prices...');
      
      // Update existing scorecard
      scorecard.teamStockPrices = {
        teama: 50,
        teamb: 50
      };
      
      await scorecard.save();
      console.log('Updated existing scorecard with default team stock prices');
    }
    
    console.log('Team stock prices initialized successfully');
    return scorecard;
  } catch (error) {
    console.error('Error initializing team stock prices:', error);
  }
}

// Run the initialization
async function run() {
  await connectToDatabase();
  await initializeTeamStockPrices();
  mongoose.disconnect();
}

run().catch(console.error); 