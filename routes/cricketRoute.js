import express from "express";
import Competitions from "../models/Competitions.js";
import Todays from "../models/Todays.js";
import Scorecards from "../models/Scorecards.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";

const router = express.Router();

router.get("/competitions", async (req, res) => {
  try {
    const { limit } = req.query;
    const competitions = await Competitions.find({}).limit(limit)
    if (!competitions || competitions.length === 0) {
      return res.status(404).json({ message: "No Competitions Found" });
    }
    res.status(200).json({
      message: `Found ${competitions.length} Competitions`,
      data: competitions
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching competitions",
      error: error.message
    });
  }
});

router.get("/today", async (req, res) => {
  try {
    const todays = await Todays.find({}).sort({ date_start_ist: 1 });
    if (!todays || todays.length === 0) {
      return res.status(404).json({ message: "No Matches Today" });
    }
    res.status(200).json({
      message: `Found ${todays.length} Matches Todays`,
      data: todays
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching today's matches",
      error: error.message
    });
  }
});

router.get("/scorecard/:match", async (req, res) => {
  try {
    const { match } = req.params;
    const scorecard = await Scorecards.findOne({ match_id: match });
    if (!scorecard) {
      return res.status(201).json({
        success: false,
        message: `No scorecard found for match_id: ${match}`,
        data: scorecard
      });
    }
    res.status(200).json({
      success: true,
      message: `Scorecard found for match_id: ${match}`,
      data: scorecard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching scorecard for match",
      error: error.message
    });
  }
});

router.get("/match/:match", async (req, res) => {
  try {
    const { match } = req.params;
    const matchInfo = await getMatch(match);
    if (!matchInfo) {
      return res.status(404).json({
        message: `No match info found for match_id: ${match}`,
        data: null
      });
    }
    res.status(200).json({
      message: `Match info found for match_id: ${match}`,
      data: matchInfo
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching match info",
      error: error.message
    });
  }
});

// Route to initialize team stock prices for a match
router.post("/initialize-team-stocks/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const scorecard = await Scorecards.findOne({ match_id: matchId });
    if (!scorecard) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Initialize team stock prices if they don't exist or are 0
    if (!scorecard.teamStockPrices || 
        !scorecard.teamStockPrices.teama || 
        !scorecard.teamStockPrices.teamb ||
        scorecard.teamStockPrices.teama === 0 ||
        scorecard.teamStockPrices.teamb === 0) {
      
      scorecard.teamStockPrices = {
        teama: 50,
        teamb: 50
      };
      
      await scorecard.save();
      
      res.status(200).json({
        success: true,
        message: "Team stock prices initialized",
        data: {
          matchId,
          teamStockPrices: scorecard.teamStockPrices
        }
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Team stock prices already initialized",
        data: {
          matchId,
          teamStockPrices: scorecard.teamStockPrices
        }
      });
    }

  } catch (error) {
    console.error("Error initializing team stocks:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing team stocks",
      error: error.message
    });
  }
});

// Route to update team stock prices based on match events
router.post("/update-team-stocks/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { teamId, eventType, runs = 0 } = req.body;
    
    const scorecard = await Scorecards.findOne({ match_id: matchId });
    if (!scorecard) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Determine which team to update
    const isTeamA = scorecard.teama.team_id === teamId;
    const teamKey = isTeamA ? 'teama' : 'teamb';
    const teamName = isTeamA ? scorecard.teama.name : scorecard.teamb.name;
    
    if (!isTeamA && scorecard.teamb.team_id !== teamId) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID"
      });
    }

    let currentPrice = scorecard.teamStockPrices[teamKey] || 50;
    let priceChange = 0;
    let reason = "";

    if (eventType === "runs_scored") {
      // 20% of runs scored
      priceChange = runs * 0.2;
      currentPrice += priceChange;
      reason = `${teamName} scored ${runs} runs`;
    } else if (eventType === "player_out") {
      // 10% decrease
      priceChange = -(currentPrice * 0.1);
      currentPrice += priceChange;
      reason = `${teamName} player got out`;
    }

    // Update the scorecard with new team stock price
    scorecard.teamStockPrices[teamKey] = Math.max(0, currentPrice); // Ensure price doesn't go below 0
    await scorecard.save();

    res.status(200).json({
      success: true,
      message: `Team stock price updated`,
      data: {
        teamId,
        teamName,
        oldPrice: currentPrice - priceChange,
        newPrice: currentPrice,
        priceChange,
        reason
      }
    });

  } catch (error) {
    console.error("Error updating team stocks:", error);
    res.status(500).json({
      success: false,
      message: "Error updating team stocks",
      error: error.message
    });
  }
});

// Route to handle match over auto-selling for team portfolios
router.post("/auto-sell-team-portfolios/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    
    // Check if match is over
    const matchOverKeywords = ["won", "loss", "draw", "tie", "abandon", "no result", "match over", "match ended", "match finished"];
    const isMatchOver = matchOverKeywords.some(keyword => 
      status.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!isMatchOver) {
      return res.status(200).json({
        success: true,
        message: "Match is not over yet"
      });
    }

    // Get all users with team portfolios for this match
    const users = await User.find({
      "teamPortfolios.matchId": matchId,
      "teamPortfolios.status": "Buy"
    });

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No team portfolios to auto-sell"
      });
    }

    // Get current team stock prices
    const scorecard = await Scorecards.findOne({ match_id: matchId });
    if (!scorecard) {
      return res.status(404).json({
        success: false,
        message: "Match scorecard not found"
      });
    }

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

    let totalAutoSold = 0;
    let totalProfit = 0;

    for (const user of users) {
      const teamPortfolios = user.teamPortfolios.filter(
        portfolio => portfolio.matchId === matchId && portfolio.status === "Buy"
      );

      for (const portfolio of teamPortfolios) {
        const isTeamA = portfolio.team === scorecard.teama.team_id;
        const currentPrice = isTeamA ? scorecard.teamStockPrices.teama : scorecard.teamStockPrices.teamb;
        
        const quantity = Number(portfolio.quantity) || 0;
        const boughtPrice = Number(portfolio.boughtPrice) || 0;
        const sellPrice = currentPrice;
        
        const profit = (sellPrice - boughtPrice) * quantity;
        const profitPercentage = boughtPrice !== 0 ? ((sellPrice - boughtPrice) / boughtPrice) * 100 : 0;

        // Update portfolio
        portfolio.soldPrice = String(sellPrice);
        portfolio.status = "Sold";
        portfolio.reason = "Match Over - Auto Sold";
        portfolio.timestamp = String(new Date());
        portfolio.profit = profit.toFixed(2);
        portfolio.profitPercentage = profitPercentage.toFixed(2);

        // Update user balance
        const sellAmount = quantity * sellPrice;
        let pointOnePercent = sellAmount * 0.001;
        if (pointOnePercent < 5) pointOnePercent = 5;
        if (pointOnePercent > 20) pointOnePercent = 20;

        let profitCut = 0;
        if (profit > 0) {
          profitCut = profit * 0.05;
          company.profitFromProfitableCuts += profitCut;
          user.amount += sellAmount - (profitCut + pointOnePercent);
        } else {
          profitCut = Math.abs(profit);
          company.profitFromUserLoss += profitCut;
          user.amount += sellAmount - pointOnePercent;
        }

        company.profitFromPlatformFees += pointOnePercent;
        company.profitFromAutoSell += boughtPrice * 0.5; // Auto-sell fee
        company.totalProfits += profitCut + pointOnePercent + (boughtPrice * 0.5);

        totalAutoSold++;
        totalProfit += profit;
      }

      await user.save();
    }

    await company.save();

    res.status(200).json({
      success: true,
      message: `Auto-sold ${totalAutoSold} team portfolios`,
      data: {
        totalAutoSold,
        totalProfit,
        matchId
      }
    });

  } catch (error) {
    console.error("Error auto-selling team portfolios:", error);
    res.status(500).json({
      success: false,
      message: "Error auto-selling team portfolios",
      error: error.message
    });
  }
});

export default router;
