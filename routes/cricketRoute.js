import express from "express";
import axios from "axios";
import dotenv from "dotenv/config";
import Match from "../models/Match.js";
import LiveScore from "../models/LiveScore.js";

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
          title: String(t.title || ''),
          abbr: String(t.abbr || ''),
          thumb_url: String(t.thumb_url || ''),
          logo_url: String(t.logo_url || ''),
          head_coach: String(t.head_coach || ''),
          score: String(t.scores || '')
        }))
        : []
    };

    await LiveScore.create(live_data);

    console.log("Live Score Stored In Database : ", live_data);

  } catch (error) {
    console.error("Error fetching or inserting match: ", error.message);
  }
};

export const fetchCompetition = async (year) => {
  try {
    const response = await axios.get(
      `{{cricstock}}seasons/2025/competitions/?token=${token}`
        `${baseURl}matches/${matchId}/scorecard?token=`
    );

    const matchData = response.data;

    if (!matchData) return null;

    console.log(matchData)
    return
  } catch (error) {
    console.error("Error fetching score for match ", error.message);
  }
};


router.get("match/scorecard/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId
    fetchMatchScorecard(matchId)
  } catch (error) {
    res.status(500).json({ message: "Error fetching match scorecard", error: error.message });
  }
});
router.get("/live/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params
    fetch_livescore_and_update_in_db(matchId)
  } catch (error) {
    res.status(500).json({ message: "Error fetching match scorecard", error: error.message });
  }
});
router.get("/competitions", async (req, res) => {
  try {
    fetchMatchScorecard(matchId)
  } catch (error) {
    res.status(500).json({ message: "Error fetching match scorecard", error: error.message });
  }
});

export default router;
