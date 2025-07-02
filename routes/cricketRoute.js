import express from "express";
import axios from "axios";
import dotenv from "dotenv/config";
import Match from "../models/Match.js";
import LiveScore from "../models/LiveScore.js";
import { getTodayToNext5DaysRange } from "../services/actions.js";

const router = express.Router();

const token = process.env.TOKEN
const matchesUrl = process.env.ENT_MATCHES
const baseURL = process.env.ENT_BASE
const currentYear = 2025

export const fetch_livescore_and_update_in_db = async (matchId) => {
  try {
    const response = await axios.get(`${baseURL}matches/${matchId}/live?token=${token}`);
    const m = response.data.response;

    const live_data = {
      mid: String(m.mid),
      status: String(m.status_str),
      status_note: String(m.status_note),
      team_batting: String(m.team_batting),
      team_bowling: String(m.team_bowling),
      live_score: {
        runs: String(m.live_score?.runs || ''),
        overs: String(m.live_score?.overs || ''),
        wickets: String(m.live_score?.wickets || ''),
        target: String(m.live_score?.target || ''),
        runrate: String(m.live_score?.runrate || ''),
        required_runrate: String(m.live_score?.required_runrate || '')
      },
      batsmen: Array.isArray(m.batsmen)
        ? m.batsmen.map(b => ({
          id: String(b.batsman_id) || null,
          name: String(b.name || ''),
          runs: String(b.runs || ''),
          balls_faced: String(b.balls_faced || ''),
          fours: String(b.fours || ''),
          sixes: String(b.sixes || ''),
          strike_rate: String(b.strike_rate || '')
        }))
        : [],
      bowlers: Array.isArray(m.bowlers)
        ? m.bowlers.map(bl => ({
          id: String(bl.bowler_id) || null,
          name: String(bl.name || ''),
          overs: String(bl.overs || ''),
          runs_conceded: String(bl.runs_conceded || ''),
          wickets: String(bl.wickets || ''),
          maidens: String(bl.maidens || ''),
          econ: String(bl.econ || '')
        }))
        : [],
      live_inning: {
        id: String(m.live_inning?.iid || ''),
        name: String(m.live_inning?.name || ''),
        status: String(m.live_inning?.status || ''),
        batting_team_id: String(m.live_inning?.batting_team_id || ''),
        fielding_team_id: String(m.live_inning?.fielding_team_id || ''),
        scores: String(m.live_inning?.scores || ''),
        last_wicket: {
          name: String(m.live_inning?.last_wicket?.name || ''),
          batsman_id: String(m.live_inning?.last_wicket?.batsman_id || ''),
          runs: String(m.live_inning?.last_wicket?.runs || ''),
          balls: String(m.live_inning?.last_wicket?.balls || ''),
          how_out: String(m.live_inning?.last_wicket?.how_out || ''),
          score_at_dismissal: String(m.live_inning?.last_wicket?.score_at_dismissal || ''),
          overs_at_dismissal: String(m.live_inning?.last_wicket?.overs_at_dismissal || '')
        },
        extra_runs: {
          byes: String(m.live_inning?.extra_runs?.byes || ''),
          legbyes: String(m.live_inning?.extra_runs?.legbyes || ''),
          wides: String(m.live_inning?.extra_runs?.wides || ''),
          noballs: String(m.live_inning?.extra_runs?.noballs || ''),
          penalty: String(m.live_inning?.extra_runs?.penalty || ''),
          total: String(m.live_inning?.extra_runs?.total || '')
        },
        current_partnership: {
          runs: String(m.live_inning?.current_partnership?.runs || ''),
          balls: String(m.live_inning?.current_partnership?.balls || ''),
          overs: String(m.live_inning?.current_partnership?.overs || ''),
          batsmen: Array.isArray(m.live_inning?.current_partnership?.batsmen)
            ? m.live_inning.current_partnership.batsmen.map(bp => ({
              name: String(bp.name || ''),
              batsman_id: String(bp.batsman_id || ''),
              runs: String(bp.runs || ''),
              balls: String(bp.balls || '')
            }))
            : []
        },
        did_not_bat: Array.isArray(m.live_inning?.did_not_bat)
          ? m.live_inning.did_not_bat.map(p => ({
            player_id: String(p.player_id || ''),
            name: String(p.name || '')
          }))
          : [],
        max_over: String(m.live_inning?.max_over || ''),
        target: String(m.live_inning?.target || ''),
        recent_scores: String(m.live_inning?.recent_scores || '')
      },
      teams: Array.isArray(m.teams)
        ? m.teams.map(t => ({
          id: String(t.tid || ''),
          name: String(t.title || ''),
          short_name: String(t.abbr || ''),
          thumb_url: String(t.thumb_url || ''),
          logo_url: String(t.logo_url || ''),
          head_coach: String(t.head_coach || ''),
          score: String(t.scores || '')
        }))
        : [],
      players: Array.isArray(m.players)
        ? m.players.map(p => ({
          id: String(p.pid || ''),
          first_name: String(p.first_name || ''),
          middle_name: String(p.middle_name || ''),
          last_name: String(p.last_name || ''),
          short_name: String(p.short_name || ''),
          birthdate: String(p.birthdate || ''),
          birthplace: String(p.birthplace || ''),
          country: String(p.country || ''),
          playing_role: String(p.playing_role || ''),
          batting_style: String(p.batting_style || ''),
          bowling_style: String(p.bowling_style || ''),
          bowling_type: String(p.bowling_type || '')
        }))
        : []
    };

    await LiveScore.findOneAndUpdate(
      { mid: live_data.mid },
      live_data,
      { upsert: true, new: true }
    );
    console.log(`Live Score : ${live_data.teams[0].name} vs ${live_data.teams[1].name}`)

  } catch (error) {
    console.error("Error fetching or inserting match: ", error.message);
  }
};

export const fetch_matches_and_update_in_db = async (status) => {
  try {
    let status_code = 4
    if (status == "upcoming") {
      status_code = 1
    }
    if (status == "ongoing") {
      status_code = 3
    }
    if (status == "completed") {
      status_code = 2
    }
    const response = await axios.get(`${baseURL}matches/?status=${status_code}&token=${token}&date=${getTodayToNext5DaysRange}`);
    const data = response.data.response;

    const live_data = {
      mid: String(m.mid),
      status: String(m.status_str),
      status_note: String(m.status_note),
      team_batting: String(m.team_batting),
      team_bowling: String(m.team_bowling),
      live_score: {
        runs: String(m.live_score?.runs || ''),
        overs: String(m.live_score?.overs || ''),
        wickets: String(m.live_score?.wickets || ''),
        target: String(m.live_score?.target || ''),
        runrate: String(m.live_score?.runrate || ''),
        required_runrate: String(m.live_score?.required_runrate || '')
      },
      batsmen: Array.isArray(m.batsmen)
        ? m.batsmen.map(b => ({
          id: String(b.batsman_id) || null,
          name: String(b.name || ''),
          runs: String(b.runs || ''),
          balls_faced: String(b.balls_faced || ''),
          fours: String(b.fours || ''),
          sixes: String(b.sixes || ''),
          strike_rate: String(b.strike_rate || '')
        }))
        : [],
      bowlers: Array.isArray(m.bowlers)
        ? m.bowlers.map(bl => ({
          id: String(bl.bowler_id) || null,
          name: String(bl.name || ''),
          overs: String(bl.overs || ''),
          runs_conceded: String(bl.runs_conceded || ''),
          wickets: String(bl.wickets || ''),
          maidens: String(bl.maidens || ''),
          econ: String(bl.econ || '')
        }))
        : [],
      live_inning: {
        id: String(m.live_inning?.iid || ''),
        name: String(m.live_inning?.name || ''),
        status: String(m.live_inning?.status || ''),
        batting_team_id: String(m.live_inning?.batting_team_id || ''),
        fielding_team_id: String(m.live_inning?.fielding_team_id || ''),
        scores: String(m.live_inning?.scores || ''),
        last_wicket: {
          name: String(m.live_inning?.last_wicket?.name || ''),
          batsman_id: String(m.live_inning?.last_wicket?.batsman_id || ''),
          runs: String(m.live_inning?.last_wicket?.runs || ''),
          balls: String(m.live_inning?.last_wicket?.balls || ''),
          how_out: String(m.live_inning?.last_wicket?.how_out || ''),
          score_at_dismissal: String(m.live_inning?.last_wicket?.score_at_dismissal || ''),
          overs_at_dismissal: String(m.live_inning?.last_wicket?.overs_at_dismissal || '')
        },
        extra_runs: {
          byes: String(m.live_inning?.extra_runs?.byes || ''),
          legbyes: String(m.live_inning?.extra_runs?.legbyes || ''),
          wides: String(m.live_inning?.extra_runs?.wides || ''),
          noballs: String(m.live_inning?.extra_runs?.noballs || ''),
          penalty: String(m.live_inning?.extra_runs?.penalty || ''),
          total: String(m.live_inning?.extra_runs?.total || '')
        },
        current_partnership: {
          runs: String(m.live_inning?.current_partnership?.runs || ''),
          balls: String(m.live_inning?.current_partnership?.balls || ''),
          overs: String(m.live_inning?.current_partnership?.overs || ''),
          batsmen: Array.isArray(m.live_inning?.current_partnership?.batsmen)
            ? m.live_inning.current_partnership.batsmen.map(bp => ({
              name: String(bp.name || ''),
              batsman_id: String(bp.batsman_id || ''),
              runs: String(bp.runs || ''),
              balls: String(bp.balls || '')
            }))
            : []
        },
        did_not_bat: Array.isArray(m.live_inning?.did_not_bat)
          ? m.live_inning.did_not_bat.map(p => ({
            player_id: String(p.player_id || ''),
            name: String(p.name || '')
          }))
          : [],
        max_over: String(m.live_inning?.max_over || ''),
        target: String(m.live_inning?.target || ''),
        recent_scores: String(m.live_inning?.recent_scores || '')
      },
      teams: Array.isArray(m.teams)
        ? m.teams.map(t => ({
          id: String(t.tid || ''),
          name: String(t.title || ''),
          short_name: String(t.abbr || ''),
          thumb_url: String(t.thumb_url || ''),
          logo_url: String(t.logo_url || ''),
          head_coach: String(t.head_coach || ''),
          score: String(t.scores || '')
        }))
        : [],
      players: Array.isArray(m.players)
        ? m.players.map(p => ({
          id: String(p.pid || ''),
          first_name: String(p.first_name || ''),
          middle_name: String(p.middle_name || ''),
          last_name: String(p.last_name || ''),
          short_name: String(p.short_name || ''),
          birthdate: String(p.birthdate || ''),
          birthplace: String(p.birthplace || ''),
          country: String(p.country || ''),
          playing_role: String(p.playing_role || ''),
          batting_style: String(p.batting_style || ''),
          bowling_style: String(p.bowling_style || ''),
          bowling_type: String(p.bowling_type || '')
        }))
        : []
    };

    await LiveScore.findOneAndUpdate(
      { mid: live_data.mid },
      live_data,
      { upsert: true, new: true }
    );
    console.log(`Live Score : ${live_data.teams[0].name} vs ${live_data.teams[1].name}`)

  } catch (error) {
    console.error("Error fetching or inserting match: ", error.message);
  }
};

router.get("/live/:match_id", async (req, res) => {
  try {
    const { match_id } = req.params;

    const match_data = await LiveScore.findOne({ mid: match_id });

    if (existing) {
      return res.status(200).json({ success: true, data: match_data });
    }

  } catch (error) {
    console.error("Error in /live/:matchId route:", error);
    res.status(500).json({ message: "Error fetching match scorecard", error: error });
  }
});

export default router;
