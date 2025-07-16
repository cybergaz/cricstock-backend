import express from "express";
import axios from "axios";
import cron from "node-cron";
import { competitions, scorecards, todays } from "../services/cricket.js";


import dotenv from "dotenv";
import {
  deleteOldOtpRequests,
  deleteOldReferrals,
} from "../services/actions.js";

const router = express.Router();

// RapidAPI configuration
const rapidAPIHeaders = {
  "x-rapidapi-key": process.env.CRICKET_API,
  "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
};

// Route to fetch and store all matches
router.get("/fetch-and-store-all", async (req, res) => {
  try {
    await fetchAndStoreAllMatches();
    res
      .status(200)
      .json({ message: "Matches fetched and stored successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

router.get("/get-score/:matchId", async (req, res) => {
  const { matchId } = req.params;
  if (!matchId) {
    return res.status(400).json({ error: "matchId is required" });
  }

  try {
    const response = await axios.get(
      `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/hscard`,
      { headers: rapidAPIHeaders }
    );
    const data = await response.data;
    // console.log(data)
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching match scores:", error.message);
    res.status(500).json({ error: "Failed to fetch match scores" });
  }
});

const fetchAndStoreAllMatches = async () => {
  try {
    const response = await axios.get(
      "https://cricbuzz-cricket.p.rapidapi.com/schedule/v1/all",
      {
        headers: rapidAPIHeaders,
      }
    );

    // Remove existing schedules
    await MatchSchedule.deleteMany({});

    // Filter valid entries
    const scheduleEntries = response.data.matchScheduleMap.filter(
      (entry) =>
        entry.scheduleAdWrapper && entry.scheduleAdWrapper.matchScheduleList
    );

    // Store them
    const storedSchedules = await MatchSchedule.create(
      scheduleEntries.map((entry) => ({
        date: entry.scheduleAdWrapper.date,
        longDate: entry.scheduleAdWrapper.longDate,
        matchScheduleList: entry.scheduleAdWrapper.matchScheduleList,
      }))
    );

    console.log(
      `✅ ${storedSchedules.length} match schedules stored successfully.`
    );
  } catch (error) {
    console.error("❌ Error fetching and storing matches:", error.message);
  }
};

// Schedule to run at 12:05 PM every day
// cron.schedule("5 0 * * *", () => {
//   console.log("⏰ Running scheduled job to fetch and store matches...");
//   fetchAndStoreAllMatches();
//   deleteOldOtpRequests();
//   deleteOldReferrals();
// });

// once a week (Sunday midnight)
cron.schedule('0 0 * * 0', () => {
  competitions()
});

// // every minute
cron.schedule('*/5 * * * * *', () => {
  scorecards()
});

// every day
cron.schedule('0 0 * * *', () => {
  todays()
});


// Route to get the count of stored matches
router.get("/matches-count", async (req, res) => {
  try {
    const matchCount = await MatchSchedule.countDocuments();

    res.status(200).json({
      message: "Total matches count retrieved",
      count: matchCount,
    });
  } catch (error) {
    console.error("Error counting matches:", error);
    res.status(500).json({
      message: "Failed to count matches",
      error: error.message,
    });
  }
});

// Route to retrieve all stored matches
router.get("/all-stored-matches", async (req, res) => {
  try {
    const storedMatches = await MatchSchedule.find({});

    res.status(200).json({
      message: "All stored matches retrieved",
      matches: storedMatches,
    });
  } catch (error) {
    console.error("Error retrieving stored matches:", error);
    res.status(500).json({
      message: "Failed to retrieve stored matches",
      error: error.message,
    });
  }
});

export default router;
