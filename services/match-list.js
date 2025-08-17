import axios from "axios";
import "dotenv/config";
import Todays from "../models/Todays.js";
import { getTodayToNext1DaysRange } from "./actions.js";

const token = process.env.TOKEN
const baseURL = process.env.ENT_BASE


export const fetchTodayMatches = async () => {
  try {

    // Clear existing matches for today
    await Todays.deleteMany({});

    const startTimes = [];

    // Fetch both ongoing (status=3) and upcoming (status=1) matches in parallel
    const ongoing_response = await axios.get(`${baseURL}matches/?status=3&date=${getTodayToNext1DaysRange()}&timezone=+5:30&token=${token}`);
    const upcoming_response = await axios.get(`${baseURL}matches/?status=1&date=${getTodayToNext1DaysRange()}&timezone=+5:30&token=${token}`);

    // Get data from responses
    const ongoing_data = ongoing_response.data.response;
    const upcoming_data = upcoming_response.data.response;

    // Combine both match types into a single array
    const allMatches = [...ongoing_data.items, ...(upcoming_data.items || [])];
    // console.log("allMatches -> ", allMatches.length)
    // for (const match of allMatches) {
    //   console.log("Match ID: ", match.match_id, "Format: " + match.format, "Format Str: " + match.format_str);
    // }

    // Process all matches at once
    await Promise.all(allMatches.map(async (element) => {
      // Only process T20 matches
      if (String(element.format_str).toLowerCase().includes("t20")) {
        // console.log("Processing Match ID: ", element.match_id, "Format: " + element.format, "Format Str: " + element.format_str);
        startTimes.push(String(element.date_start_ist || ''));

        // Safely handle nested objects and properties with proper type casting
        await Todays.updateOne(
          { match_id: element.match_id },
          {
            $set: {
              match_id: Number(element.match_id || 0),
              title: String(element.title || ''),
              short_title: String(element.short_title || ''),
              subtitle: String(element.subtitle || ''),
              match_number: String(element.match_number || ''),
              format: Number(element.format || 0),
              format_str: String(element.format_str || ''),
              status: Number(element.status || 0),
              status_str: String(element.status_str || ''),
              status_note: String(element.status_note || ''),
              verified: String(element.verified || ''),
              pre_squad: String(element.pre_squad || ''),
              odds_available: String(element.odds_available || ''),
              game_state: Number(element.game_state || 0),
              game_state_str: String(element.game_state_str || ''),
              domestic: String(element.domestic || ''),
              competition: {
                cid: Number(element.competition?.cid || 0),
                title: String(element.competition?.title || ''),
                abbr: String(element.competition?.abbr || ''),
                type: String(element.competition?.type || ''),
                category: String(element.competition?.category || ''),
                match_format: String(element.competition?.match_format || ''),
                season: String(element.competition?.season || ''),
                status: String(element.competition?.status || ''),
                datestart: String(element.competition?.datestart || ''),
                dateend: String(element.competition?.dateend || ''),
                country: String(element.competition?.country || ''),
                total_matches: String(element.competition?.total_matches || ''),
                total_rounds: String(element.competition?.total_rounds || ''),
                total_teams: String(element.competition?.total_teams || ''),
              },
              teama: {
                team_id: Number(element.teama?.team_id || 0),
                name: String(element.teama?.name || ''),
                short_name: String(element.teama?.short_name || ''),
                logo_url: String(element.teama?.logo_url || ''),
                thumb_url: String(element.teama?.thumb_url || ''),
                scores_full: String(element.teama?.scores_full || ''),
                scores: String(element.teama?.scores || ''),
                overs: String(element.teama?.overs || ''),
              },
              teamb: {
                team_id: Number(element.teamb?.team_id || 0),
                name: String(element.teamb?.name || ''),
                short_name: String(element.teamb?.short_name || ''),
                logo_url: String(element.teamb?.logo_url || ''),
                thumb_url: String(element.teamb?.thumb_url || ''),
                scores_full: String(element.teamb?.scores_full || ''),
                scores: String(element.teamb?.scores || ''),
                overs: String(element.teamb?.overs || ''),
              },
              date_start: String(element.date_start || ''),
              date_end: String(element.date_end || ''),
              timestamp_start: Number(element.timestamp_start || 0),
              timestamp_end: Number(element.timestamp_end || 0),
              date_start_ist: String(element.date_start_ist || ''),
              date_end_ist: String(element.date_end_ist || ''),
              venue: {
                venue_id: String(element.venue?.venue_id || ''),
                name: String(element.venue?.name || ''),
                location: String(element.venue?.location || ''),
                country: String(element.venue?.country || ''),
                timezone: String(element.venue?.timezone || ''),
              },
              umpires: String(element.umpires || ''),
              referee: String(element.referee || ''),
              equation: String(element.equation || ''),
              live: String(element.live || ''),
              result: String(element.result || ''),
              result_type: Number(element.result_type || 0),
              win_margin: String(element.win_margin || ''),
              winning_team_id: Number(element.winning_team_id || 0),
              commentary: Number(element.commentary || 0),
              wagon: Number(element.wagon || 0),
              latest_inning_number: Number(element.latest_inning_number || 0),
              presquad_time: String(element.presquad_time || ''),
              verify_time: String(element.verify_time || ''),
              weather: {
                weather: String(element.weather?.weather || ''),
                weather_desc: String(element.weather?.weather_desc || ''),
                temp: String(element.weather?.temp || ''),
                humidity: String(element.weather?.humidity || ''),
                visibility: String(element.weather?.visibility || ''),
                wind_speed: String(element.weather?.wind_speed || ''),
                clouds: String(element.weather?.clouds || ''),
              },
              pitch: {
                pitch_condition: String(element.pitch?.pitch_condition || ''),
                batting_condition: String(element.pitch?.batting_condition || ''),
                pace_bowling_condition: String(element.pitch?.pace_bowling_condition || ''),
                spine_bowling_condition: String(element.pitch?.spine_bowling_condition || ''),
              },
              toss: {
                text: String(element.toss?.text || ''),
                winner: Number(element.toss?.winner || 0),
                decision: Number(element.toss?.decision || 0),
              }
            }
          },
          { upsert: true }
        );
      }
    }));

    // console.log("Match pushed");
    // process.exit(0);

    return startTimes;
  } catch (error) {
    console.error(`[TODAYS] Error updating today's matches: ${error.message}`);
    return [];
  }
};
