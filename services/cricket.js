import axios from "axios";
import "dotenv/config";
import Competitions from "../models/Competitions.js";
import Todays from "../models/Todays.js";
import Scorecards from "../models/Scorecards.js";
import { getTodayToNext1DaysRange } from "./actions.js";

const token = process.env.TOKEN
const baseURL = process.env.ENT_BASE
const year = process.env.YEAR

export const getMatch = async (matchId) => {
  try {
    const response = await axios.get(`${baseURL}matches/${matchId}/info?token=${token}`);
    return response.data;
  } catch (error) {
    console.error(`[SR] Error fetching match info for match_id: ${matchId} - ${error.message}`);
    return null;
  }
};

export const getMatchFromDB = async (matchId) => {
  try {
    const match = await Todays.findOne({ match_id: matchId }).lean();
    if (match) {
      return match;
    } else {
      console.warn(`[SR] Match with match_id: ${matchId} not found in database.`);
      return null;
    }
  } catch (error) {
    console.error(`[SR] Error fetching match from database for match_id: ${matchId} - ${error.message}`);
    return null;
  }
}
