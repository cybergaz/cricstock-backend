import Scorecards from "../models/Scorecards.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
import axios from "axios";

// Constants for price adjustments
const RUNS_MULTIPLIER = 0.2;  // 20% of runs scored
const WICKET_PENALTY = 0.1;   // 10% decrease on wicket
const AUTO_SELL_FEE = 0.5;    // 50% fee on auto-sell

// Track the last processed ball for each match to avoid duplicate processing
const lastProcessedBalls = new Map();

/**
 * Process match data to update team stock prices based on events
 * @param {Object} matchData - The match data from the websocket
 */
export const processMatchEvents = async (matchData) => {
  try {
    if (!matchData || !matchData.match_id || !matchData.live) {
      return;
    }

    const matchId = matchData.match_id.toString();
    
    // Get the latest commentaries
    const commentaries = matchData.live.commentaries || [];
    if (!commentaries.length) return;

    // Sort commentaries by timestamp to process in chronological order
    const sortedCommentaries = [...commentaries].sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the scorecard to update prices
    const scorecard = await Scorecards.findOne({ match_id: matchId });
    if (!scorecard) {
      console.log(`No scorecard found for match ${matchId}`);
      return;
    }

    // Initialize team stock prices if they don't exist
    if (!scorecard.teamStockPrices) {
      scorecard.teamStockPrices = {
        teama: 50,
        teamb: 50
      };
    }

    // Process each commentary for events that affect stock prices
    for (const commentary of sortedCommentaries) {
      // Create a unique key for this ball to avoid duplicate processing
      const ballKey = `${matchId}-${commentary.over}-${commentary.ball}-${commentary.event_id}`;
      
      // Skip if we've already processed this ball
      if (lastProcessedBalls.has(ballKey)) continue;
      
      // Mark this ball as processed
      lastProcessedBalls.set(ballKey, Date.now());
      
      // Process based on event type
      if (commentary.event === "ball") {
        // Determine which team is batting
        const battingTeamId = getBattingTeamId(matchData, commentary);
        if (!battingTeamId) continue;
        
        // Process runs scored
        if (commentary.run > 0) {
          await updateTeamStockPrice(matchId, battingTeamId, "runs_scored", commentary.run);
        }
        
        // Process wicket
        if (commentary.wicket_batsman_id || commentary.how_out && commentary.how_out !== "Not out") {
          // The bowling team gets a boost when they take a wicket
          const bowlingTeamId = getBowlingTeamId(matchData, commentary);
          if (bowlingTeamId) {
            await updateTeamStockPrice(matchId, bowlingTeamId, "player_out", 0);
            
            // Auto-sell player portfolios on wicket with 50% loss
            if (commentary.wicket_batsman_id) {
              await autoSellPlayerPortfolios(matchId, commentary.wicket_batsman_id);
            }
          }
        }
      }
    }
    
    // Check if the match is over to auto-sell all portfolios
    if (isMatchOver(matchData)) {
      await autoSellAllPortfolios(matchId, matchData.status_str || "");
    }
    
    // Update player prices for all batsmen in the match
    await updatePlayerPrices(matchId, matchData);
    
  } catch (error) {
    console.error("Error processing match events:", error);
  }
};

/**
 * Calculate and update player prices based on their batting performance
 * @param {string} matchId - The match ID
 * @param {Object} matchData - The match data
 */
export const updatePlayerPrices = async (matchId, matchData) => {
  try {
    if (!matchData || !matchData.scorecard || !matchData.scorecard.innings) {
      return;
    }
    
    // Get the scorecard to update player prices
    const scorecard = await Scorecards.findOne({ match_id: matchId });
    if (!scorecard) {
      console.log(`No scorecard found for match ${matchId}`);
      return;
    }
    
    // Process each inning
    for (let i = 0; i < scorecard.innings.length; i++) {
      const inning = scorecard.innings[i];
      
      // Skip if no batsmen data
      if (!inning.batsmen || inning.batsmen.length === 0) continue;
      
      // Update prices for each batsman
      for (let j = 0; j < inning.batsmen.length; j++) {
        const batsman = inning.batsmen[j];
        const batsmanIndex = j; // Use array index as batting position
        
        // Calculate player price
        const currentPrice = calculatePlayerPrice(batsman, batsmanIndex);
        
        // Update the price in the scorecard
        scorecard.innings[i].batsmen[j].currentPrice = currentPrice;
      }
    }
    
    // Save the updated scorecard
    await scorecard.save();
    console.log(`Updated player prices for match ${matchId}`);
    
  } catch (error) {
    console.error(`Error updating player prices: ${error.message}`);
  }
};

/**
 * Calculate player price based on batting performance
 * @param {Object} batsman - The batsman data
 * @param {number} batsmanIndex - The batsman's position in the batting order
 * @returns {number} - The calculated price
 */
export const calculatePlayerPrice = (batsman, batsmanIndex) => {
  if (!batsman) return 0;
  
  // Base price depends on batting position
  const basePrice = batsmanIndex <= 2 ? 35 : batsmanIndex < 5 ? 30 : 25;
  
  // Calculate price based on batting performance
  const price = basePrice -
    Number(batsman.run0 || 0) * 1.0 +
    Number(batsman.run1 || 0) * 0.75 +
    Number(batsman.run2 || 0) * 1.5 +
    Number(batsman.run3 || 0) * 2.25 +
    Number(batsman.fours || 0) * 3 +
    Number(batsman.sixes || 0) * 4.5;
  
  return Math.max(0, price); // Ensure price doesn't go below 0
};

/**
 * Update team stock price based on an event
 * @param {string} matchId - The match ID
 * @param {string} teamId - The team ID
 * @param {string} eventType - The type of event (runs_scored, player_out)
 * @param {number} runs - Number of runs scored (for runs_scored event)
 */
export const updateTeamStockPrice = async (matchId, teamId, eventType, runs = 0) => {
  try {
    // Call the API endpoint to update team stock prices
    const apiUrl = `http://localhost:${process.env.SERVER_PORT || 5000}/cricket/update-team-stocks/${matchId}`;
    await axios.post(apiUrl, {
      teamId,
      eventType,
      runs
    });
    
    console.log(`Updated team ${teamId} stock price for match ${matchId} based on ${eventType}`);
  } catch (error) {
    console.error(`Error updating team stock price: ${error.message}`);
  }
};

/**
 * Auto-sell player portfolios when a player gets out
 * @param {string} matchId - The match ID
 * @param {string} playerId - The player ID who got out
 */
export const autoSellPlayerPortfolios = async (matchId, playerId) => {
  try {
    // Find users with portfolios for this player
    const users = await User.find({
      "playerPortfolios.matchId": matchId,
      "playerPortfolios.playerId": playerId,
      "playerPortfolios.status": "Buy"
    });
    
    if (users.length === 0) return;
    
    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({
        name: "cricstock11",
        totalProfits: 0,
        profitFromPlatformFees: 0,
        profitFromProfitableCuts: 0,
        profitFromUserLoss: 0,
        profitFromAutoSell: 0
      });
    }
    
    // Apply 50% loss to all portfolios of this player
    for (const user of users) {
      const playerPortfolios = user.playerPortfolios.filter(
        portfolio => portfolio.matchId === matchId && 
                    portfolio.playerId === playerId && 
                    portfolio.status === "Buy"
      );
      
      for (const portfolio of playerPortfolios) {
        const quantity = Number(portfolio.quantity) || 0;
        const boughtPrice = Number(portfolio.boughtPrice) || 0;
        const sellPrice = boughtPrice * 0.5; // 50% loss
        
        const profit = (sellPrice - boughtPrice) * quantity;
        const profitPercentage = -50; // Always 50% loss
        
        // Update portfolio
        portfolio.soldPrice = String(sellPrice);
        portfolio.status = "Sold";
        portfolio.reason = "Player Out - Auto Sold";
        portfolio.timestamp = String(new Date());
        portfolio.profit = profit.toFixed(2);
        portfolio.profitPercentage = profitPercentage.toFixed(2);
        
        // Update user balance
        const sellAmount = quantity * sellPrice;
        let pointOnePercent = sellAmount * 0.001;
        if (pointOnePercent < 5) pointOnePercent = 5;
        if (pointOnePercent > 20) pointOnePercent = 20;
        
        // Always a loss, so company profits
        const profitCut = Math.abs(profit);
        company.profitFromUserLoss += profitCut;
        user.amount += sellAmount - pointOnePercent;
        
        company.profitFromPlatformFees += pointOnePercent;
        company.profitFromAutoSell += boughtPrice * AUTO_SELL_FEE;
        company.totalProfits += profitCut + pointOnePercent + (boughtPrice * AUTO_SELL_FEE);
      }
      
      await user.save();
    }
    
    await company.save();
    console.log(`Auto-sold portfolios for player ${playerId} in match ${matchId}`);
  } catch (error) {
    console.error(`Error auto-selling player portfolios: ${error.message}`);
  }
};

/**
 * Auto-sell all portfolios when a match is over
 * @param {string} matchId - The match ID
 * @param {string} status - The match status string
 */
export const autoSellAllPortfolios = async (matchId, status) => {
  try {
    // Call the API endpoint to auto-sell team portfolios
    const apiUrl = `http://localhost:${process.env.SERVER_PORT || 5000}/cricket/auto-sell-team-portfolios/${matchId}`;
    await axios.post(apiUrl, { status });
    
    console.log(`Auto-sold all team portfolios for match ${matchId} with status: ${status}`);
  } catch (error) {
    console.error(`Error auto-selling team portfolios: ${error.message}`);
  }
};

/**
 * Check if a match is over based on status
 * @param {Object} matchData - The match data
 * @returns {boolean} - True if the match is over
 */
const isMatchOver = (matchData) => {
  const matchOverKeywords = ["won", "loss", "draw", "tie", "abandon", "no result", "match over", "match ended", "match finished", "completed", "cancelled"];
  
  // Check status_str
  if (matchData.status_str && matchOverKeywords.some(keyword => 
    matchData.status_str.toLowerCase().includes(keyword.toLowerCase()))) {
    return true;
  }
  
  // Check status_note
  if (matchData.status_note && matchOverKeywords.some(keyword => 
    matchData.status_note.toLowerCase().includes(keyword.toLowerCase()))) {
    return true;
  }
  
  // Check result
  if (matchData.result && matchOverKeywords.some(keyword => 
    matchData.result.toLowerCase().includes(keyword.toLowerCase()))) {
    return true;
  }
  
  return false;
};

/**
 * Get the batting team ID from match data and commentary
 * @param {Object} matchData - The match data
 * @param {Object} commentary - The ball commentary
 * @returns {string|null} - The batting team ID or null
 */
const getBattingTeamId = (matchData, commentary) => {
  if (!matchData.live || !matchData.live.live_inning) return null;
  
  const battingTeamId = matchData.live.live_inning.batting_team_id;
  return battingTeamId ? battingTeamId.toString() : null;
};

/**
 * Get the bowling team ID from match data and commentary
 * @param {Object} matchData - The match data
 * @param {Object} commentary - The ball commentary
 * @returns {string|null} - The bowling team ID or null
 */
const getBowlingTeamId = (matchData, commentary) => {
  if (!matchData.live || !matchData.live.live_inning) return null;
  
  const fieldingTeamId = matchData.live.live_inning.fielding_team_id;
  return fieldingTeamId ? fieldingTeamId.toString() : null;
};

/**
 * Clean up the lastProcessedBalls cache periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Remove entries older than 1 hour
  for (const [key, timestamp] of lastProcessedBalls.entries()) {
    if (timestamp < oneHourAgo) {
      lastProcessedBalls.delete(key);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes 