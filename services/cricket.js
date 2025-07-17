import axios from "axios";
import Competitions from "../models/Competitions.js";
import Todays from "../models/Todays.js";
import { getTodayToNext1DaysRange } from "./actions.js";
import Scorecards from "../models/Scorecards.js";

const token = process.env.TOKEN
const baseURL = process.env.ENT_BASE
const year = process.env.YEAR

// services
export const competitions = async () => {
  try {
    await Competitions.deleteMany({});

    const competitions_response = await axios.get(`${baseURL}seasons/${year}/competitions?token=${token}&per_page=76`);
    const competitions_data = competitions_response.data.response;
    await Promise.all(competitions_data.items.map(async (element) => {
      if (String(element.status).toLowerCase().includes("upcoming") && (String(element.match_format).toLowerCase().includes("t20") || String(element.match_format).toLowerCase().includes("mixed"))) {
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
      }
    }));
    console.log(`[ SR ] : ${competitions_data.items.length} Competitions`);

  } catch (error) {
    console.error(`[COMPETITIONS] Error updating competitions: ${error.message}`);
  }
};

export const todays = async () => {
  try {
    await Todays.deleteMany({});

    const ongoing_response = await axios.get(`${baseURL}matches/?status=3&date=${getTodayToNext1DaysRange()}&token=${token}`);
    const ongoing_data = ongoing_response.data.response;
    await Promise.all(ongoing_data.items.map(async (element) => {
      if (String(element.format_str).toLowerCase().includes("t20")) {
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
              weather: {
                weather: String(element.weather.weather || ''),
                weather_desc: String(element.weather.weather_desc || ''),
                temp: String(element.weather.temp || ''),
                humidity: String(element.weather.humidity || ''),
                visibility: String(element.weather.visibility || ''),
                wind_speed: String(element.weather.wind_speed || ''),
                clouds: String(element.weather.clouds || ''),
              },
              pitch: {
                pitch_condition: String(element.pitch.pitch_condition || ''),
                batting_condition: String(element.pitch.batting_condition || ''),
                pace_bowling_condition: String(element.pitch.pace_bowling_condition || ''),
                spine_bowling_condition: String(element.pitch.spine_bowling_condition || ''),
              },
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

    const upcoming_response = await axios.get(`${baseURL}matches/?status=1&date=${getTodayToNext1DaysRange()}&token=${token}`);
    const upcoming_data = upcoming_response.data.response;
    await Promise.all((upcoming_data.items || []).map(async (element) => {
      if (String(element.format_str).toLowerCase().includes("t20")) {
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
              weather: {
                weather: String(element.weather.weather || ''),
                weather_desc: String(element.weather.weather_desc || ''),
                temp: String(element.weather.temp || ''),
                humidity: String(element.weather.humidity || ''),
                visibility: String(element.weather.visibility || ''),
                wind_speed: String(element.weather.wind_speed || ''),
                clouds: String(element.weather.clouds || ''),
              },
              pitch: {
                pitch_condition: String(element.pitch.pitch_condition || ''),
                batting_condition: String(element.pitch.batting_condition || ''),
                pace_bowling_condition: String(element.pitch.pace_bowling_condition || ''),
                spine_bowling_condition: String(element.pitch.spine_bowling_condition || ''),
              },
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
    console.log(`[SR] : ${upcoming_data.items.length + ongoing_data.items.length} Matches Today`);
  } catch (error) {
    console.error(`[TODAYS] Error updating today's matches: ${error.message}`);
  }
};
export const scorecards = async () => {
  try {
    const ongoing_response = await axios.get(`${baseURL}matches/?status=3&date=${getTodayToNext1DaysRange()}&token=${token}`);
    const ongoing_data = ongoing_response.data.response;
    let validMatchIds = [];

    for (const match of ongoing_data.items) {
      if (String(match.format_str).toLowerCase().includes("t20"))
        validMatchIds.push(match.match_id);
    }

    await Scorecards.deleteMany({});

    if (!validMatchIds.length) {
      // console.log("[SR] No Live Matches");
      return;
    }

    for (const matchId of validMatchIds) {
      await scorecard(matchId);
    }

    console.log(`[SR] ${validMatchIds.length} Scorecards Updated`);
  } catch (error) {
    console.error(
      `[SCORECARDS] Error updating all live match scorecards: ${error.message}`
    );
  }
};
// utility
export const scorecard = async (match_id) => {
  try {
    const scorecards_response = await axios.get(`${baseURL}matches/${match_id}/scorecard?token=${token}`);
    const scorecards_data = scorecards_response.data.response
    if (String(scorecards_data.status_str).toLowerCase() == "live") {
      await Scorecards.updateOne(
        { match_id: scorecards_data.match_id || '' },
        {
          $set: {
            match_id: String(scorecards_data.match_id || ''),
            title: String(scorecards_data.title || ''),
            short_title: String(scorecards_data.short_title || ''),
            subtitle: String(scorecards_data.subtitle || ''),
            match_number: String(scorecards_data.match_number || ''),
            format: String(scorecards_data.format || ''),
            format_str: String(scorecards_data.format_str || ''),
            status: String(scorecards_data.status || ''),
            status_str: String(scorecards_data.status_str || ''),
            status_note: String(scorecards_data.status_note || ''),
            verified: String(scorecards_data.verified || ''),
            pre_squad: String(scorecards_data.pre_squad || ''),
            odds_available: String(scorecards_data.odds_available || ''),
            game_state: String(scorecards_data.game_state || ''),
            game_state_str: String(scorecards_data.game_state_str || ''),
            competition: {
              cid: String((scorecards_data.competition || {}).cid || ''),
              title: String((scorecards_data.competition || {}).title || ''),
              abbr: String((scorecards_data.competition || {}).abbr || ''),
              type: String((scorecards_data.competition || {}).type || ''),
              category: String((scorecards_data.competition || {}).category || ''),
              match_format: String((scorecards_data.competition || {}).match_format || ''),
              season: String((scorecards_data.competition || {}).season || ''),
              status: String((scorecards_data.competition || {}).status || ''),
              datestart: String((scorecards_data.competition || {}).datestart || ''),
              dateend: String((scorecards_data.competition || {}).dateend || ''),
              country: String((scorecards_data.competition || {}).country || ''),
              total_matches: String((scorecards_data.competition || {}).total_matches || ''),
              total_rounds: String((scorecards_data.competition || {}).total_rounds || ''),
              total_teams: String((scorecards_data.competition || {}).total_teams || ''),
            },
            teama: {
              team_id: String((scorecards_data.teama || {}).team_id || ''),
              name: String((scorecards_data.teama || {}).name || ''),
              short_name: String((scorecards_data.teama || {}).short_name || ''),
              logo_url: String((scorecards_data.teama || {}).logo_url || ''),
              thumb_url: String((scorecards_data.teama || {}).thumb_url || ''),
              scores_full: String((scorecards_data.teama || {}).scores_full || ''),
              scores: String((scorecards_data.teama || {}).scores || ''),
              overs: String((scorecards_data.teama || {}).overs || ''),
            },
            teamb: {
              team_id: String((scorecards_data.teamb || {}).team_id || ''),
              name: String((scorecards_data.teamb || {}).name || ''),
              short_name: String((scorecards_data.teamb || {}).short_name || ''),
              logo_url: String((scorecards_data.teamb || {}).logo_url || ''),
              thumb_url: String((scorecards_data.teamb || {}).thumb_url || ''),
              scores_full: String((scorecards_data.teamb || {}).scores_full || ''),
              scores: String((scorecards_data.teamb || {}).scores || ''),
              overs: String((scorecards_data.teamb || {}).overs || ''),
            },
            date_start: String(scorecards_data.date_start || ''),
            date_end: String(scorecards_data.date_end || ''),
            timestamp_start: String(scorecards_data.timestamp_start || ''),
            timestamp_end: String(scorecards_data.timestamp_end || ''),
            date_start_ist: String(scorecards_data.date_start_ist || ''),
            date_end_ist: String(scorecards_data.date_end_ist || ''),
            venue: {
              venue_id: String(((scorecards_data.venue || {}).venue_id) || ''),
              name: String(((scorecards_data.venue || {}).name) || ''),
              location: String(((scorecards_data.venue || {}).location) || ''),
              country: String(((scorecards_data.venue || {}).country) || ''),
              timezone: String(((scorecards_data.venue || {}).timezone) || ''),
            },
            umpires: String(scorecards_data.umpires || ''),
            referee: String(scorecards_data.referee || ''),
            equation: String(scorecards_data.equation || ''),
            live: String(scorecards_data.live || ''),
            result: String(scorecards_data.result || ''),
            result_type: String(scorecards_data.result_type || ''),
            win_margin: String(scorecards_data.win_margin || ''),
            winning_team_id: String(scorecards_data.winning_team_id || ''),
            commentary: String(scorecards_data.commentary || ''),
            wagon: String(scorecards_data.wagon || ''),
            latest_inning_number: String(scorecards_data.latest_inning_number || ''),
            presquad_time: String(scorecards_data.presquad_time || ''),
            verify_time: String(scorecards_data.verify_time || ''),
            match_dls_affected: String(scorecards_data.match_dls_affected || ''),
            live_inning_number: String(scorecards_data.live_inning_number || ''),
            weather: {
              weather: String(((scorecards_data.weather || {}).weather) || ''),
              weather_desc: String(((scorecards_data.weather || {}).weather_desc) || ''),
              temp: String(((scorecards_data.weather || {}).temp) || ''),
              humidity: String(((scorecards_data.weather || {}).humidity) || ''),
              visibility: String(((scorecards_data.weather || {}).visibility) || ''),
              wind_speed: String(((scorecards_data.weather || {}).wind_speed) || ''),
              clouds: String(((scorecards_data.weather || {}).clouds) || ''),
            },
            pitch: {
              pitch_condition: String(((scorecards_data.pitch || {}).pitch_condition) || ''),
              batting_condition: String(((scorecards_data.pitch || {}).batting_condition) || ''),
              pace_bowling_condition: String(((scorecards_data.pitch || {}).pace_bowling_condition) || ''),
              spine_bowling_condition: String(((scorecards_data.pitch || {}).spine_bowling_condition) || ''),
            },
            toss: {
              text: String(((scorecards_data.toss || {}).text) || ''),
              winner: String(((scorecards_data.toss || {}).winner) || ''),
              decision: String(((scorecards_data.toss || {}).decision) || ''),
            },
            current_over: String(scorecards_data.current_over || ''),
            previous_over: String(scorecards_data.previous_over || ''),
            man_of_the_match: String(scorecards_data.man_of_the_match || ''),
            man_of_the_series: String(scorecards_data.man_of_the_series || ''),
            team_batting_first: String(scorecards_data.team_batting_first || ''),
            team_batting_second: String(scorecards_data.team_batting_second || ''),
            last_five_overs: String(scorecards_data.last_five_overs || ''),
            innings: (scorecards_data.innings || []).map(inning => ({
              iid: String(inning.iid || ''),
              number: String(inning.number || ''),
              name: String(inning.name || ''),
              short_name: String(inning.short_name || ''),
              status: String(inning.status || ''),
              issuperover: String(inning.issuperover || ''),
              result: String(inning.result || ''),
              batting_team_id: String(inning.batting_team_id || ''),
              fielding_team_id: String(inning.fielding_team_id || ''),
              scores: String(inning.scores || ''),
              scores_full: String(inning.scores_full || ''),
              batsmen: (inning.batsmen || []).map(batsman => ({
                name: String(batsman.name || ''),
                batsman_id: String(batsman.batsman_id || ''),
                batting: String(batsman.batting || ''),
                position: String(batsman.position || ''),
                role: String(batsman.role || ''),
                role_str: String(batsman.role_str || ''),
                runs: String(batsman.runs || ''),
                balls_faced: String(batsman.balls_faced || ''),
                fours: String(batsman.fours || ''),
                sixes: String(batsman.sixes || ''),
                run0: String(batsman.run0 || ''),
                run1: String(batsman.run1 || ''),
                run2: String(batsman.run2 || ''),
                run3: String(batsman.run3 || ''),
                run5: String(batsman.run5 || ''),
                how_out: String(batsman.how_out || ''),
                dismissal: String(batsman.dismissal || ''),
                strike_rate: String(batsman.strike_rate || ''),
                bowler_id: String(batsman.bowler_id || ''),
                first_fielder_id: String(batsman.first_fielder_id || ''),
                second_fielder_id: String(batsman.second_fielder_id || ''),
                third_fielder_id: String(batsman.third_fielder_id || ''),
              })),
              bowlers: (inning.bowlers || []).map(bowler => ({
                name: String(bowler.name || ''),
                bowler_id: String(bowler.bowler_id || ''),
                bowling: String(bowler.bowling || ''),
                position: String(bowler.position || ''),
                overs: String(bowler.overs || ''),
                maidens: String(bowler.maidens || ''),
                runs_conceded: String(bowler.runs_conceded || ''),
                wickets: String(bowler.wickets || ''),
                noballs: String(bowler.noballs || ''),
                wides: String(bowler.wides || ''),
                econ: String(bowler.econ || ''),
                run0: String(bowler.run0 || ''),
                bowledcount: String(bowler.bowledcount || ''),
                lbwcount: String(bowler.lbwcount || ''),
              })),
              powerplay: {
                p1: {
                  startover: String((((inning.powerplay || {}).p1 || {}).startover) || ''),
                  endover: String((((inning.powerplay || {}).p1 || {}).endover) || ''),
                }
              },
              review: {
                batting: {
                  batting_team_total_review: String(((((inning.review || {}).batting) || {}).batting_team_total_review) || ''),
                  batting_team_review_success: String(((((inning.review || {}).batting) || {}).batting_team_review_success) || ''),
                  batting_team_review_failed: String(((((inning.review || {}).batting) || {}).batting_team_review_failed) || ''),
                  batting_team_review_available: String(((((inning.review || {}).batting) || {}).batting_team_review_available) || ''),
                  batting_team_review_retained: String(((((inning.review || {}).batting) || {}).batting_team_review_retained) || ''),
                },
                bowling: {
                  bowling_team_total_review: String(((((inning.review || {}).bowling) || {}).bowling_team_total_review) || ''),
                  bowling_team_review_success: String(((((inning.review || {}).bowling) || {}).bowling_team_review_success) || ''),
                  bowling_team_review_failed: String(((((inning.review || {}).bowling) || {}).bowling_team_review_failed) || ''),
                  bowling_team_review_available: String(((((inning.review || {}).bowling) || {}).bowling_team_review_available) || ''),
                  bowling_team_review_retained: String(((((inning.review || {}).bowling) || {}).bowling_team_review_retained) || ''),
                }
              },
              fows: (inning.fows || []).map(fow => ({
                name: String(fow.name || ''),
                batsman_id: String(fow.batsman_id || ''),
                runs: String(fow.runs || ''),
                balls: String(fow.balls || ''),
                how_out: String(fow.how_out || ''),
                score_at_dismissal: String(fow.score_at_dismissal || ''),
                overs_at_dismissal: String(fow.overs_at_dismissal || ''),
                bowler_id: String(fow.bowler_id || ''),
                dismissal: String(fow.dismissal || ''),
                number: String(fow.number || ''),
              })),
              last_wicket: {
                name: String(((inning.last_wicket || {}).name) || ''),
                batsman_id: String(((inning.last_wicket || {}).batsman_id) || ''),
                runs: String(((inning.last_wicket || {}).runs) || ''),
                balls: String(((inning.last_wicket || {}).balls) || ''),
                how_out: String(((inning.last_wicket || {}).how_out) || ''),
                score_at_dismissal: String(((inning.last_wicket || {}).score_at_dismissal) || ''),
                overs_at_dismissal: String(((inning.last_wicket || {}).overs_at_dismissal) || ''),
                bowler_id: String(((inning.last_wicket || {}).bowler_id) || ''),
                dismissal: String(((inning.last_wicket || {}).dismissal) || ''),
                number: String(((inning.last_wicket || {}).number) || ''),
              },
              extra_runs: {
                byes: String(((inning.extra_runs || {}).byes) || ''),
                legbyes: String(((inning.extra_runs || {}).legbyes) || ''),
                wides: String(((inning.extra_runs || {}).wides) || ''),
                noballs: String(((inning.extra_runs || {}).noballs) || ''),
                penalty: String(((inning.extra_runs || {}).penalty) || ''),
                total: String(((inning.extra_runs || {}).total) || ''),
              },
              equations: {
                runs: String(((inning.equations || {}).runs) || ''),
                wickets: String(((inning.equations || {}).wickets) || ''),
                overs: String(((inning.equations || {}).overs) || ''),
                bowlers_used: String(((inning.equations || {}).bowlers_used) || ''),
                runrate: String(((inning.equations || {}).runrate) || ''),
              },
              current_partnership: {
                runs: String(((inning.current_partnership || {}).runs) || ''),
                balls: String(((inning.current_partnership || {}).balls) || ''),
                overs: String(((inning.current_partnership || {}).overs) || ''),
                batsmen: [
                  {
                    name: String((((inning.current_partnership || {}).batsmen || [])[0]?.name || '')),
                    batsman_id: String((((inning.current_partnership || {}).batsmen || [])[0]?.batsman_id || '')),
                    runs: String((((inning.current_partnership || {}).batsmen || [])[0]?.runs || '')),
                    balls: String((((inning.current_partnership || {}).batsmen || [])[0]?.balls || '')),
                  },
                  {
                    name: String((((inning.current_partnership || {}).batsmen || [])[1]?.name || '')),
                    batsman_id: String((((inning.current_partnership || {}).batsmen || [])[1]?.batsman_id || '')),
                    runs: String((((inning.current_partnership || {}).batsmen || [])[1]?.runs || '')),
                    balls: String((((inning.current_partnership || {}).batsmen || [])[1]?.balls || '')),
                  }
                ]
              },
              did_not_bat: (inning.did_not_bat || []).map(player => ({
                player_id: String(player.player_id || ''),
                name: String(player.name || ''),
              })),
              max_over: String(inning.max_over || ''),
              target: String(inning.target || ''),
            })),
            players: (scorecards_data.players || []).map(player => ({
              pid: String(player.pid || ''),
              title: String(player.title || ''),
              short_name: String(player.short_name || ''),
              first_name: String(player.first_name || ''),
              last_name: String(player.last_name || ''),
              middle_name: String(player.middle_name || ''),
              birthdate: String(player.birthdate || ''),
              birthplace: String(player.birthplace || ''),
              country: String(player.country || ''),
              primary_team: String(player.primary_team || ''),
              logo_url: String(player.logo_url || ''),
              playing_role: String(player.playing_role || ''),
              batting_style: String(player.batting_style || ''),
              bowling_style: String(player.bowling_style || ''),
              fielding_position: String(player.fielding_position || ''),
              recent_match: String(player.recent_match || ''),
              recent_appearance: String(player.recent_appearance || ''),
              fantasy_player_rating: String(player.fantasy_player_rating || ''),
              facebook_profile: String(player.facebook_profile || ''),
              twitter_profile: String(player.twitter_profile || ''),
              instagram_profile: String(player.instagram_profile || ''),
              debut_data: String(player.debut_data || ''),
              bowling_type: String(player.bowling_type || ''),
              thumb_url: String(player.thumb_url || ''),
              profile_image: String(player.profile_image || ''),
              nationality: String(player.nationality || ''),
              role: String(player.role || ''),
              role_str: String(player.role_str || ''),
            })),
            match_notes: scorecards_data.match_notes || ''
          }
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error(`[SCORECARD] Error updating scorecard for match_id: ${match_id} - ${error.message}`);
  }

}
// Utility function for finding match info
export const getMatch = async (matchId) => {
  try {
    const response = await axios.get(`${baseURL}matches/${matchId}/info?token=${token}`);
    return response.data;
  } catch (error) {
    console.error(`[SR] Error fetching match info for match_id: ${matchId} - ${error.message}`);
    return null;
  }
};
