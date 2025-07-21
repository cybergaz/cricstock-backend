import express from "express";
import Competitions from "../models/Competitions.js";
import Todays from "../models/Todays.js";
import Scorecards from "../models/Scorecards.js";

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

export default router;
