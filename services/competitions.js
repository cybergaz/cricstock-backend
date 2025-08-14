import axios from "axios";
import "dotenv/config";
import Competitions from "../models/Competitions.js";
import Todays from "../models/Todays.js";
import Scorecards from "../models/Scorecards.js";
import { getTodayToNext1DaysRange } from "./actions.js";

const token = process.env.TOKEN
const baseURL = process.env.ENT_BASE
const year = process.env.YEAR

export const fetchLiveCompetitions = async (status) => {
  try {
    // fetch total items first
    const total_items_response = await axios.get(`${baseURL}/competitions?token=${token}&status=${status}`);
    const data = total_items_response.data.response;
    if (!data) {
      console.error("[COMPETITIONS] No competitions found or total_items is undefined.");
      return;
    }
    // console.log(data.total_items)

    // delete existing competitions
    // await Competitions.deleteMany({});
    const competitions_response = await axios.get(`${baseURL}/competitions?token=${token}&per_page=${data.total_items}&&paged=1&status=${status}`);
    const competitions_data = competitions_response.data.response;
    // console.log("competitions_data -> ", competitions_data)
    await Promise.all(competitions_data.items.map(async (element) => {
      // if (String(element.status).toLowerCase().includes("upcoming") && (String(element.match_format).toLowerCase().includes("t20") || String(element.match_format).toLowerCase().includes("mixed"))) {
      await Competitions.updateOne(
        { cid: element.cid },
        {
          $set: {
            cid: String(element.cid || ''),
            title: String(element.title || ''),
            abbr: String(element.abbr || ''),
            type: String(element.type || ''),
            category: String(element.category || ''),
            match_format: String(element.match_format || ''),
            season: String(element.season || ''),
            status: String(element.status || ''),
            datestart: String(element.datestart || ''),
            dateend: String(element.dateend || ''),
            country: String(element.country || ''),
            total_matches: String(element.total_matches || ''),
            total_rounds: String(element.total_rounds || ''),
            total_teams: String(element.total_teams || ''),
          }
        },
        { upsert: true }
      );
    }));
    console.log(`[SR] : ${competitions_data.items.length} Competitions Fetched`);
  } catch (error) {
    console.error(`[COMPETITIONS] Error updating competitions: ${error.message}`);
  }
};

