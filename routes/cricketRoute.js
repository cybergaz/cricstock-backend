import express from "express";
import Competitions from "../models/Competitions.js";
import Todays from "../models/Todays.js";
import { competitions, scorecards, todays } from "../services/cricket.js";
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
    const todays = await Todays.find({})
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
      return res.status(404).json({
        message: `No scorecard found for match_id: ${match}`,
        data: scorecard
      });
    }
    res.status(200).json({
      message: `Scorecard found for match_id: ${match}`,
      data: scorecard
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching scorecard for match",
      error: error.message
    });
  }
});

// week
// competitions()

// one day
// todays()

// 5 sec
// scorecards()


// router.get("/live", async (req, res) => {
//   try {
//     const live_matches = await LiveMatches.find({});
//     if (!live_matches || live_matches.length === 0) {
//       return res.status(404).json({ message: "No Live Matches Found" });
//     }
//     res.status(200).json({
//       message: `Found ${live_matches.length} Live Matches`,
//       data: live_matches
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching live matches",
//       error: error.message
//     });
//   }
// });
// router.get("/", async (req, res) => {
//   try {
//     const scheduled_matches = await ScheduledMatches.find({});
//     if (!scheduled_matches || scheduled_matches.length === 0) {
//       return res.status(404).json({ message: "No Scheduled Matches Found" });
//     }
//     res.status(200).json({
//       message: `Found ${scheduled_matches.length} Scheduled Matches`,
//       data: scheduled_matches
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching scheduled matches",
//       error: error.message
//     });
//   }
// });
// router.get("/live/:match_id", async (req, res) => {
//   try {
//     const { match_id } = req.params;

//     const match_data = await LiveScore.findOne({ mid: match_id });

//     if (!match_data) {
//       return res.status(404).json({ message: "No Live Score Found" });
//     }

//     res.status(200).json({ data: match_data });

//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching match by ID",
//       error: error.message
//     });
//   }
// });
// router.get("/scorecard/:match_id", async (req, res) => {
//   try {
//     const { match_id } = req.params;

//     const match_data = await LiveScorecard.findOne({ match_id: match_id });

//     if (!match_data) {
//       return res.status(404).json({ message: "No Live Scorecard Found" });
//     }

//     res.status(200).json({ data: match_data });

//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching match by ID",
//       error: error.message
//     });
//   }
// });

export default router;
