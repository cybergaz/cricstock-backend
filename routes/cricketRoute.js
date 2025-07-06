import express from "express";
import { update_competitions, update_livematches, update_livescore, update_livescores, update_scheduledmatches } from "../services/cricket.js";
import ScheduledMatches from "../models/ScheduledMatches.js";
import LiveMatches from "../models/LiveMatches.js";
import LiveScore from "../models/LiveScore.js";
import Competitions from "../models/Competition.js";

const router = express.Router();


router.get("/scheduled", async (req, res) => {
  try {
    const scheduled_matches = await ScheduledMatches.find({});
    if (!scheduled_matches || scheduled_matches.length === 0) {
      return res.status(404).json({ message: "No Scheduled Matches Found" });
    }
    res.status(200).json({
      message: `Found ${scheduled_matches.length} Scheduled Matches`,
      data: scheduled_matches
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching scheduled matches",
      error: error.message
    });
  }
});

router.get("/competitions", async (req, res) => {
  try {
    const competitions = await Competitions.find({}).limit(10)
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

router.get("/live", async (req, res) => {
  try {
    const live_matches = await LiveMatches.find({});
    if (!live_matches || live_matches.length === 0) {
      return res.status(404).json({ message: "No Live Matches Found" });
    }
    res.status(200).json({
      message: `Found ${live_matches.length} Live Matches`,
      data: live_matches
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching live matches",
      error: error.message
    });
  }
});

router.get("/live/:match_id", async (req, res) => {
  try {
    const { match_id } = req.params;

    const match_data = await LiveScore.findOne({ mid: match_id });

    if (!match_data) {
      return res.status(404).json({ message: "No Live Score Found for this Match" });
    }

    res.status(200).json({ data: match_data });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching match by ID",
      error: error.message
    });
  }
});

// update_competitions()
// update_scheduledmatches()
// update_livematches()
// update_livescores()

export default router;
