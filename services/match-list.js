import axios from "axios";
import "dotenv/config";
import Todays from "../models/Todays.js";
import { getTodayToNext1DaysRange } from "./actions.js";

const token = process.env.TOKEN
const baseURL = process.env.ENT_BASE

export const todays = async () => {
  try {
    await Todays.deleteMany({});
    /** @type {string[]} */
    const startTimes = [];

    const ongoing_response = await axios.get(`${baseURL}matches/?status=3&date=${getTodayToNext1DaysRange()}&timezone=+5:30&token=${token}`);
    const ongoing_data = ongoing_response.data.response;
    await Promise.all(ongoing_data.items.map(async (element) => {
      if (String(element.format_str).toLowerCase().includes("t20")) {
        startTimes.push(String(element.date_start_ist));
        await Todays.updateOne(
          { match_id: element.match_id },
          {
            $set: {
              match_id: element.match_id,
              title: element.title,
              short_title: String(element.short_title || ''),
              subtitle: String(element.subtitle || ''),
              match_number: String(element.match_number || ''),
              format: String(element.format || ''),
              format_str: String(element.format_str || ''),
              status: String(element.status || ''),
              status_str: String(element.status_str || ''),
              status_note: String(element.status_note || ''),
              verified: String(element.verified || ''),
              pre_squad: String(element.pre_squad || ''),
              odds_available: String(element.odds_available || ''),
              game_state: String(element.game_state || ''),
              game_state_str: String(element.game_state_str || ''),
              domestic: String(element.domestic || ''),
              competition: {
                cid: String(element.competition.cid || ''),
                title: String(element.competition.title || ''),
                abbr: String(element.competition.abbr || ''),
                type: String(element.competition.type || ''),
                category: String(element.competition.category || ''),
                match_format: String(element.competition.match_format || ''),
                season: String(element.competition.season || ''),
                status: String(element.competition.status || ''),
                datestart: String(element.competition.datestart || ''),
                dateend: String(element.competition.dateend || ''),
                country: String(element.competition.country || ''),
                total_matches: String(element.competition.total_matches || ''),
                total_rounds: String(element.competition.total_rounds || ''),
                total_teams: String(element.competition.total_teams || ''),
              },
              teama: {
                team_id: String(element.teama.team_id || ''),
                name: String(element.teama.name || ''),
                short_name: String(element.teama.short_name || ''),
                logo_url: String(element.teama.logo_url || ''),
                scores_full: String(element.teama.scores_full || ''),
                overs: String(element.teama.overs || ''),
              },
              teamb: {
                team_id: String(element.teamb.team_id || ''),
                name: String(element.teamb.name || ''),
                short_name: String(element.teamb.short_name || ''),
                logo_url: String(element.teamb.logo_url || ''),
                scores_full: String(element.teamb.scores_full || ''),
                overs: String(element.teamb.overs || ''),
              },
              date_start: String(element.date_start || ''),
              date_end: String(element.date_end || ''),
              timestamp_start: String(element.timestamp_start || ''),
              timestamp_end: String(element.timestamp_end || ''),
              date_start_ist: String(element.date_start_ist || ''),
              date_end_ist: String(element.date_end_ist || ''),
              venue: {
                venue_id: String(element.venue.venue_id || ''),
                name: String(element.venue.name || ''),
                location: String(element.venue.location || ''),
                country: String(element.venue.country || ''),
                timezone: String(element.venue.timezone || ''),
              },
              umpires: String(element.umpires || ''),
              referee: String(element.referee || ''),
              equation: String(element.equation || ''),
              live: String(element.live || ''),
              result: String(element.result || ''),
              result_type: String(element.result_type || ''),
              win_margin: String(element.win_margin || ''),
              winning_team_id: String(element.winning_team_id || ''),
              commentary: String(element.commentary || ''),
              wagon: String(element.wagon || ''),
              latest_inning_number: String(element.latest_inning_number || ''),
              presquad_time: String(element.presquad_time || ''),
              verify_time: String(element.verify_time || ''),
              // weather: {
              //   weather: String(element.weather.weather || ''),
              //   weather_desc: String(element.weather.weather_desc || ''),
              //   temp: String(element.weather.temp || ''),
              //   humidity: String(element.weather.humidity || ''),
              //   visibility: String(element.weather.visibility || ''),
              //   wind_speed: String(element.weather.wind_speed || ''),
              //   clouds: String(element.weather.clouds || ''),
              // },
              // pitch: {
              //   pitch_condition: String(element.pitch.pitch_condition || ''),
              //   batting_condition: String(element.pitch.batting_condition || ''),
              //   pace_bowling_condition: String(element.pitch.pace_bowling_condition || ''),
              //   spine_bowling_condition: String(element.pitch.spine_bowling_condition || ''),
              // },
              toss: {
                text: String(element.toss.text || ''),
                winner: String(element.toss.winner || ''),
                decision: String(element.toss.decision || ''),
              }
            }
          },
          { upsert: true }
        );
      }

    }));
    const upcoming_response = await axios.get(`${baseURL}matches/?status=1&date=${getTodayToNext1DaysRange()}&timezone=+5:30&token=${token}`);
    const upcoming_data = upcoming_response.data.response;
    await Promise.all((upcoming_data.items || []).map(async (element) => {
      if (String(element.format_str).toLowerCase().includes("t20")) {
        startTimes.push(String(element.date_start_ist));
        await Todays.updateOne(
          { match_id: element.match_id },
          {
            $set: {
              match_id: String(element.match_id || ''),
              title: String(element.title || ''),
              short_title: String(element.short_title || ''),
              subtitle: String(element.subtitle || ''),
              match_number: String(element.match_number || ''),
              format: String(element.format || ''),
              format_str: String(element.format_str || ''),
              status: String(element.status || ''),
              status_str: String(element.status_str || ''),
              status_note: String(element.status_note || ''),
              verified: String(element.verified || ''),
              pre_squad: String(element.pre_squad || ''),
              odds_available: String(element.odds_available || ''),
              game_state: String(element.game_state || ''),
              game_state_str: String(element.game_state_str || ''),
              domestic: String(element.domestic || ''),
              competition: {
                cid: String(element.competition.cid || ''),
                title: String(element.competition.title || ''),
                abbr: String(element.competition.abbr || ''),
                type: String(element.competition.type || ''),
                category: String(element.competition.category || ''),
                match_format: String(element.competition.match_format || ''),
                season: String(element.competition.season || ''),
                status: String(element.competition.status || ''),
                datestart: String(element.competition.datestart || ''),
                dateend: String(element.competition.dateend || ''),
                country: String(element.competition.country || ''),
                total_matches: String(element.competition.total_matches || ''),
                total_rounds: String(element.competition.total_rounds || ''),
                total_teams: String(element.competition.total_teams || ''),
              },
              teama: {
                team_id: String(element.teama.team_id || ''),
                name: String(element.teama.name || ''),
                short_name: String(element.teama.short_name || ''),
                logo_url: String(element.teama.logo_url || ''),
                scores_full: String(element.teama.scores_full || ''),
                overs: String(element.teama.overs || ''),
              },
              teamb: {
                team_id: String(element.teamb.team_id || ''),
                name: String(element.teamb.name || ''),
                short_name: String(element.teamb.short_name || ''),
                logo_url: String(element.teamb.logo_url || ''),
                scores_full: String(element.teamb.scores_full || ''),
                overs: String(element.teamb.overs || ''),
              },
              date_start: String(element.date_start || ''),
              date_end: String(element.date_end || ''),
              timestamp_start: String(element.timestamp_start || ''),
              timestamp_end: String(element.timestamp_end || ''),
              date_start_ist: String(element.date_start_ist || ''),
              date_end_ist: String(element.date_end_ist || ''),
              venue: {
                venue_id: String(element.venue.venue_id || ''),
                name: String(element.venue.name || ''),
                location: String(element.venue.location || ''),
                country: String(element.venue.country || ''),
                timezone: String(element.venue.timezone || ''),
              },
              umpires: String(element.umpires || ''),
              referee: String(element.referee || ''),
              equation: String(element.equation || ''),
              live: String(element.live || ''),
              result: String(element.result || ''),
              result_type: String(element.result_type || ''),
              win_margin: String(element.win_margin || ''),
              winning_team_id: String(element.winning_team_id || ''),
              commentary: String(element.commentary || ''),
              wagon: String(element.wagon || ''),
              latest_inning_number: String(element.latest_inning_number || ''),
              presquad_time: String(element.presquad_time || ''),
              verify_time: String(element.verify_time || ''),
              // weather: {
              //   weather: String(element.weather.weather || ''),
              //   weather_desc: String(element.weather.weather_desc || ''),
              //   temp: String(element.weather.temp || ''),
              //   humidity: String(element.weather.humidity || ''),
              //   visibility: String(element.weather.visibility || ''),
              //   wind_speed: String(element.weather.wind_speed || ''),
              //   clouds: String(element.weather.clouds || ''),
              // },
              // pitch: {
              //   pitch_condition: String(element.pitch.pitch_condition || ''),
              //   batting_condition: String(element.pitch.batting_condition || ''),
              //   pace_bowling_condition: String(element.pitch.pace_bowling_condition || ''),
              //   spine_bowling_condition: String(element.pitch.spine_bowling_condition || ''),
              // },
              toss: {
                text: String(element.toss.text || ''),
                winner: String(element.toss.winner || ''),
                decision: String(element.toss.decision || ''),
              }
            }
          },
          { upsert: true }
        );
      }
    }));
    return startTimes;
  } catch (error) {
    console.error(`[TODAYS] Error updating today's matches: ${error.message}`);
    return [];
  }
};

