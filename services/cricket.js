import axios from "axios";
import LiveScores from "../models/LiveScore.js";
import LiveMatches from "../models/LiveMatches.js"
import { getTodayToNext1DaysRange, getTodayToNext7DaysRange } from "./actions.js";
import ScheduledMatches from "../models/ScheduledMatches.js";
import Competitions from "../models/Competition.js";
import LiveScorecards from "../models/LiveScorecard.js";

const token = process.env.TOKEN
const baseURL = process.env.ENT_BASE

// Services
export const update_livescores = async () => {
    try {
        await LiveScores.deleteMany({});

        const matches = await LiveMatches.find({}, { match_id: 1 })
        if (!matches.length) {
            console.log("No matches found in DB");
            return;
        }
        await Promise.all(
            matches.map(m => update_livescore(m.match_id))
        );
    } catch (error) {
        console.error("error updating live scores:", error.message);
    }
};
export const update_livescorecards = async () => {
    try {
        await LiveScorecards.deleteMany({});

        const matches = await LiveMatches.find({}, { match_id: 1 })
        if (!matches.length) {
            console.log("No matches found in DB");
            return;
        }
        await Promise.all(
            matches.map(m => {
                update_livescorecard(m.match_id)
            }
            )
        );
    } catch (error) {
        console.error("error updating live scorecards:", error.message);
    }
};
export const update_livematches = async () => {
    try {
        await LiveMatches.deleteMany({});

        const response = await axios.get(
            `${baseURL}matches/?status=3&date=${getTodayToNext1DaysRange()}&token=${token}`
        );
        const data = response.data.response;

        const newMatches = data.items.map(element => ({
            match_id: String(element.match_id),
            title: String(element.title),
            short_title: String(element.short_title),
            subtitle: String(element.subtitle),
            match_number: String(element.match_number),
            format: String(element.format),
            format_str: String(element.format_str),
            status: String(element.status),
            status_str: String(element.status_str),
            status_note: String(element.status_note),
            verified: String(element.verified),
            pre_squad: String(element.pre_squad),
            odds_available: String(element.odds_available),
            game_state: String(element.game_state),
            game_state_str: String(element.game_state_str),
            domestic: String(element.domestic),

            competition: {
                cid: String(element.competition.cid),
                title: String(element.competition.title),
                abbr: String(element.competition.abbr),
                type: String(element.competition.type),
                category: String(element.competition.category),
                match_format: String(element.competition.match_format),
                season: String(element.competition.season),
                status: String(element.competition.status),
                datestart: String(element.competition.datestart),
                dateend: String(element.competition.dateend),
                country: String(element.competition.country),
                total_matches: String(element.competition.total_matches),
                total_rounds: String(element.competition.total_rounds),
                total_teams: String(element.competition.total_teams),
            },

            teama: {
                team_id: String(element.teama.team_id),
                name: String(element.teama.name),
                short_name: String(element.teama.short_name),
                logo_url: String(element.teama.logo_url),
                scores_full: String(element.teama.scores_full),
                scores: String(element.teama.scores),
                overs: String(element.teama.overs),
            },
            teamb: {
                team_id: String(element.teamb.team_id),
                name: String(element.teamb.name),
                short_name: String(element.teamb.short_name),
                logo_url: String(element.teamb.logo_url),
                scores_full: String(element.teamb.scores_full),
                scores: String(element.teamb.scores),
                overs: String(element.teamb.overs),
            },
            date_start: String(element.date_start),
            date_end: String(element.date_end),
            timestamp_start: String(element.timestamp_start),
            timestamp_end: String(element.timestamp_end),
            date_start_ist: String(element.date_start_ist),
            date_end_ist: String(element.date_end_ist),

            venue: {
                venue_id: String(element.venue.venue_id),
                name: String(element.venue.name),
                location: String(element.venue.location),
                country: String(element.venue.country),
                timezone: String(element.venue.timezone),
            },
            weather: {
                weather: String(element.weather.weather),
                weather_desc: String(element.weather.weather_desc),
                temp: String(element.weather.temp),
                humidity: String(element.weather.humidity),
                visibility: String(element.weather.visibility),
                wind_speed: String(element.weather.wind_speed),
                clouds: String(element.weather.clouds),
            },
            pitch: {
                pitch_condition: String(element.pitch.pitch_condition),
                batting_condition: String(element.pitch.batting_condition),
                pace_bowling_condition: String(element.pitch.pace_bowling_condition),
                spine_bowling_condition: String(element.pitch.spine_bowling_condition),
            },
            umpires: String(element.umpires),
            referee: String(element.referee),
            equation: String(element.equation),
            live: String(element.live),
            result: String(element.result),
            result_type: String(element.result_type),
            win_margin: String(element.win_margin),
            winning_team_id: String(element.winning_team_id),
            commentary: String(element.commentary),
            wagon: String(element.wagon),
            latest_inning_number: String(element.latest_inning_number),
            presquad_time: String(element.presquad_time),
            verify_time: String(element.verify_time),
            match_dls_affected: String(element.match_dls_affected),
            day: String(element.day),
            session: String(element.session),
        }));

        await LiveMatches.insertMany(newMatches);

        console.log(`Live Matches Updated!`);

    } catch (error) {
        console.error('Error updating live matches:', error.message);
    }
};
export const update_scheduledmatches = async () => {
    try {
        // Delete old scheduled matches data
        await ScheduledMatches.deleteMany({});

        const response = await axios.get(`${baseURL}matches/?status=1\u0026date=${getTodayToNext7DaysRange()}\u0026token=${token}`);
        const data = response.data.response;
        await Promise.all(data.items.map(async (element) => {
            await ScheduledMatches.updateOne(
                { match_id: element.match_id },
                {
                    $set: {
                        match_id: String(element.match_id),

                        title: String(element.title),
                        short_title: String(element.short_title),
                        match_title: String(element.subtitle),
                        match_number: String(element.match_number),
                        format: String(element.format_str),
                        status: String(element.status_str),

                        competition: {
                            cid: String(element.competition.cid),
                            title: String(element.competition.title),
                            short_title: String(element.competition.abbr),
                            type: String(element.competition.tour),
                            category: String(element.competition.category),
                            status: String(element.competition.status),
                            datestart: String(element.competition.datestart),
                            dateend: String(element.competition.dateend),
                        },

                        teama: {
                            team_id: String(element.teama.team_id),
                            name: String(element.teama.name),
                            short_name: String(element.teama.short_name),
                            logo_url: String(element.teama.logo_url),
                        },
                        teamb: {
                            team_id: String(element.teamb.team_id),
                            name: String(element.teamb.name),
                            short_name: String(element.teamb.short_name),
                            logo_url: String(element.teamb.logo_url),
                        },
                        date_start: String(element.date_start),
                        date_end: String(element.date_end),
                        timestamp_start: String(element.timestamp_start),
                        timestamp_end: String(element.timestamp_end),
                        date_start_ist: String(element.date_start_ist),
                        date_end_ist: String(element.date_end_ist),

                        venue: {
                            venue_id: String(element.venue.venue_id),
                            name: String(element.venue.name),
                            location: String(element.venue.location),
                            country: String(element.venue.country),
                            timezone: String(element.venue.timezone),
                        },
                    }
                },
                { upsert: true }
            );
        }));
        console.log("Scheduleds Updated!");
    } catch (error) {
        console.error("error updating scheduled matches: ", error.message);
    }
};
export const update_competitions = async () => {
    try {
        // Delete old competitions data
        await Competitions.deleteMany({});

        const response = await axios.get(`${baseURL}seasons/2025/competitions/?token=${token}\u0026per_page=76`);
        const data = response.data.response;
        await Promise.all(data.items.map(async (element) => {
            await Competitions.updateOne(
                { cid: element.cid },
                {
                    $set: {
                        cid: String(element.cid),
                        title: String(element.title),
                        short_title: String(element.short_title),
                        type: String(element.type),
                        category: String(element.category),
                        match_format: String(element.match_format),
                        status: String(element.status),
                        season: String(element.season),
                        datestart: String(element.datestart),
                        dateend: String(element.dateend),
                        country: String(element.country),
                        total_matches: String(element.total_matches),
                        total_teams: String(element.total_teams),
                    }
                },
                { upsert: true }
            );
        }));
        console.log('Competitions Updated!');

    } catch (error) {
        console.error("error updating competitions: ", error.message);
    }
};

// Utility
export const update_livescore = async (match_id) => {
    try {
        const response = await axios.get(`${baseURL}matches/${match_id}/live?token=${token}`);
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

        await LiveScores.findOneAndUpdate(
            { mid: live_data.mid },
            live_data,
            { upsert: true, new: true }
        );
        console.log('Scores Updated!');

    } catch (error) {
        console.error(`error updating live score of ${match_id}: `, error.message);
    }
};
export const update_livescorecard = async (match_id) => {
    try {
        const response = await axios.get(
            `${baseURL}matches/${match_id}/scorecard?token=${token}`
        );
        const data = response.data.response;

        await LiveScorecards.updateOne(
            { match_id: String(data.match_id ?? '') },
            {
                $set: {
                    match_id: String(data.match_id ?? ''),
                    title: String(data.title ?? ''),
                    short_title: String(data.short_title ?? ''),
                    subtitle: String(data.subtitle ?? ''),
                    match_number: String(data.match_number ?? ''),
                    format: String(data.format ?? ''),
                    format_str: String(data.format_str ?? ''),
                    status: String(data.status ?? ''),
                    status_str: String(data.status_str ?? ''),
                    status_note: String(data.status_note ?? ''),
                    verified: String(data.verified ?? ''),
                    pre_squad: String(data.pre_squad ?? ''),
                    odds_available: String(data.odds_available ?? ''),
                    game_state: String(data.game_state ?? ''),
                    game_state_str: String(data.game_state_str ?? ''),
                    domestic: String(data.domestic ?? ''),
                    current_over: String(data.current_over ?? ''),
                    previous_over: String(data.previous_over ?? ''),
                    man_of_the_series: String(data.man_of_the_series ?? ''),
                    is_followon: String(data.is_followon ?? ''),
                    team_batting_first: String(data.team_batting_first ?? ''),
                    team_batting_second: String(data.team_batting_second ?? ''),
                    last_five_overs: String(data.last_five_overs ?? ''),
                    date_start: String(data.date_start ?? ''),
                    date_end: String(data.date_end ?? ''),
                    timestamp_start: String(data.timestamp_start ?? ''),
                    timestamp_end: String(data.timestamp_end ?? ''),
                    date_start_ist: String(data.date_start_ist ?? ''),
                    date_end_ist: String(data.date_end_ist ?? ''),
                    umpires: String(data.umpires ?? ''),
                    referee: String(data.referee ?? ''),
                    equation: String(data.equation ?? ''),
                    live: String(data.live ?? ''),
                    result: String(data.result ?? ''),
                    result_type: String(data.result_type ?? ''),
                    win_margin: String(data.win_margin ?? ''),
                    winning_team_id: String(data.winning_team_id ?? ''),
                    commentary: String(data.commentary ?? ''),
                    wagon: String(data.wagon ?? ''),
                    latest_inning_number: String(data.latest_inning_number ?? ''),
                    presquad_time: String(data.presquad_time ?? ''),
                    verify_time: String(data.verify_time ?? ''),
                    match_dls_affected: String(data.match_dls_affected ?? ''),
                    day: String(data.day ?? ''),
                    session: String(data.session ?? ''),
                    day_remaining_over: String(data.day_remaining_over ?? ''),

                    competition: {
                        cid: String(data.competition?.cid ?? ''),
                        title: String(data.competition?.title ?? ''),
                        abbr: String(data.competition?.abbr ?? ''),
                        type: String(data.competition?.type ?? ''),
                        category: String(data.competition?.category ?? ''),
                        match_format: String(data.competition?.match_format ?? ''),
                        season: String(data.competition?.season ?? ''),
                        status: String(data.competition?.status ?? ''),
                        datestart: String(data.competition?.datestart ?? ''),
                        dateend: String(data.competition?.dateend ?? ''),
                        country: String(data.competition?.country ?? ''),
                        total_matches: String(data.competition?.total_matches ?? ''),
                        total_rounds: String(data.competition?.total_rounds ?? ''),
                        total_teams: String(data.competition?.total_teams ?? ''),
                    },

                    man_of_the_match: {
                        pid: String(data.man_of_the_match?.pid ?? ''),
                        name: String(data.man_of_the_match?.name ?? ''),
                        thumb_url: String(data.man_of_the_match?.thumb_url ?? ''),
                    },

                    teama: {
                        team_id: String(data.teama?.team_id ?? ''),
                        name: String(data.teama?.name ?? ''),
                        short_name: String(data.teama?.short_name ?? ''),
                        logo_url: String(data.teama?.logo_url ?? ''),
                        scores_full: String(data.teama?.scores_full ?? ''),
                        scores: String(data.teama?.scores ?? ''),
                        overs: String(data.teama?.overs ?? ''),
                    },

                    teamb: {
                        team_id: String(data.teamb?.team_id ?? ''),
                        name: String(data.teamb?.name ?? ''),
                        short_name: String(data.teamb?.short_name ?? ''),
                        logo_url: String(data.teamb?.logo_url ?? ''),
                        scores_full: String(data.teamb?.scores_full ?? ''),
                        scores: String(data.teamb?.scores ?? ''),
                        overs: String(data.teamb?.overs ?? ''),
                    },

                    venue: {
                        venue_id: String(data.venue?.venue_id ?? ''),
                        name: String(data.venue?.name ?? ''),
                        location: String(data.venue?.location ?? ''),
                        country: String(data.venue?.country ?? ''),
                        timezone: String(data.venue?.timezone ?? ''),
                    },

                    weather: {
                        weather: String(data.weather?.weather ?? ''),
                        weather_desc: String(data.weather?.weather_desc ?? ''),
                        temp: String(data.weather?.temp ?? ''),
                        humidity: String(data.weather?.humidity ?? ''),
                        visibility: String(data.weather?.visibility ?? ''),
                        wind_speed: String(data.weather?.wind_speed ?? ''),
                        clouds: String(data.weather?.clouds ?? ''),
                    },

                    pitch: {
                        pitch_condition: String(data.pitch?.pitch_condition ?? ''),
                        batting_condition: String(data.pitch?.batting_condition ?? ''),
                        pace_bowling_condition: String(data.pitch?.pace_bowling_condition ?? ''),
                        spine_bowling_condition: String(data.pitch?.spine_bowling_condition ?? ''),
                    },

                    innings: Array.isArray(data.innings)
                        ? data.innings.map((inning) => ({
                            iid: String(inning.iid ?? ''),
                            number: String(inning.number ?? ''),
                            name: String(inning.name ?? ''),
                            short_name: String(inning.short_name ?? ''),
                            status: String(inning.status ?? ''),
                            issuperover: String(inning.issuperover ?? ''),
                            result: String(inning.result ?? ''),
                            batting_team_id: String(inning.batting_team_id ?? ''),
                            fielding_team_id: String(inning.fielding_team_id ?? ''),
                            scores: String(inning.scores ?? ''),
                            scores_full: String(inning.scores_full ?? ''),

                            batsmen: Array.isArray(inning.batsmen)
                                ? inning.batsmen.map((b) => ({
                                    batsman_id: String(b.batsman_id ?? ''),
                                    name: String(b.name ?? ''),
                                    batting: String(b.batting ?? ''),
                                    position: String(b.position ?? ''),
                                    role: String(b.role ?? ''),
                                    role_str: String(b.role_str ?? ''),
                                    runs: String(b.runs ?? ''),
                                    balls_faced: String(b.balls_faced ?? ''),
                                    fours: String(b.fours ?? ''),
                                    sixes: String(b.sixes ?? ''),
                                    run0: String(b.run0 ?? ''),
                                    run1: String(b.run1 ?? ''),
                                    run2: String(b.run2 ?? ''),
                                    run3: String(b.run3 ?? ''),
                                    run5: String(b.run5 ?? ''),
                                    how_out: String(b.how_out ?? ''),
                                    dismissal: String(b.dismissal ?? ''),
                                    strike_rate: String(b.strike_rate ?? ''),
                                    bowler_id: String(b.bowler_id ?? ''),
                                    first_fielder_id: String(b.first_fielder_id ?? ''),
                                    second_fielder_id: String(b.second_fielder_id ?? ''),
                                    third_fielder_id: String(b.third_fielder_id ?? ''),
                                }))
                                : [],

                            bowlers: Array.isArray(inning.bowlers)
                                ? inning.bowlers.map((bl) => ({
                                    bowler_id: String(bl.bowler_id ?? ''),
                                    name: String(bl.name ?? ''),
                                    bowling: String(bl.bowling ?? ''),
                                    position: String(bl.position ?? ''),
                                    overs: String(bl.overs ?? ''),
                                    maidens: String(bl.maidens ?? ''),
                                    runs_conceded: String(bl.runs_conceded ?? ''),
                                    wickets: String(bl.wickets ?? ''),
                                    noballs: String(bl.noballs ?? ''),
                                    wides: String(bl.wides ?? ''),
                                    econ: String(bl.econ ?? ''),
                                    run0: String(bl.run0 ?? ''),
                                    bowledcount: String(bl.bowledcount ?? ''),
                                    lbwcount: String(bl.lbwcount ?? ''),
                                }))
                                : [],

                            fow: Array.isArray(inning.fow)
                                ? inning.fow.map((fw) => ({
                                    batsman_id: String(fw.batsman_id ?? ''),
                                    name: String(fw.name ?? ''),
                                    runs: String(fw.runs ?? ''),
                                    balls: String(fw.balls ?? ''),
                                    how_out: String(fw.how_out ?? ''),
                                    score_at_dismissal: String(fw.score_at_dismissal ?? ''),
                                    overs_at_dismissal: String(fw.overs_at_dismissal ?? ''),
                                    bowler_id: String(fw.bowler_id ?? ''),
                                    dismissal: String(fw.dismissal ?? ''),
                                    number: String(fw.number ?? ''),
                                }))
                                : [],

                            last_wicket: inning.last_wicket
                                ? {
                                    batsman_id: String(inning.last_wicket.batsman_id ?? ''),
                                    name: String(inning.last_wicket.name ?? ''),
                                    runs: String(inning.last_wicket.runs ?? ''),
                                    balls: String(inning.last_wicket.balls ?? ''),
                                    how_out: String(inning.last_wicket.how_out ?? ''),
                                    score_at_dismissal: String(inning.last_wicket.score_at_dismissal ?? ''),
                                    overs_at_dismissal: String(inning.last_wicket.overs_at_dismissal ?? ''),
                                    bowler_id: String(inning.last_wicket.bowler_id ?? ''),
                                    dismissal: String(inning.last_wicket.dismissal ?? ''),
                                    number: String(inning.last_wicket.number ?? ''),
                                }
                                : null,

                            extra_runs: inning.extra_runs
                                ? {
                                    byes: String(inning.extra_runs.byes ?? ''),
                                    legbyes: String(inning.extra_runs.legbyes ?? ''),
                                    wides: String(inning.extra_runs.wides ?? ''),
                                    noballs: String(inning.extra_runs.noballs ?? ''),
                                    penalty: String(inning.extra_runs.penalty ?? ''),
                                    total: String(inning.extra_runs.total ?? ''),
                                }
                                : null,

                            max_over: String(inning.max_over ?? ''),
                            target: String(inning.target ?? ''),
                            equations: inning.equations
                                ? {
                                    runs: String(inning.equations.runs ?? ''),
                                    wickets: String(inning.equations.wickets ?? ''),
                                    overs: String(inning.equations.overs ?? ''),
                                    bowlers_used: String(inning.equations.bowlers_used ?? ''),
                                    runrate: String(inning.equations.runrate ?? ''),
                                }
                                : null,

                            current_partnership: inning.current_partnership
                                ? {
                                    runs: String(inning.current_partnership.runs ?? ''),
                                    balls: String(inning.current_partnership.balls ?? ''),
                                    overs: String(inning.current_partnership.overs ?? ''),
                                    batsmen: Array.isArray(inning.current_partnership.batsmen)
                                        ? inning.current_partnership.batsmen.map((p) => ({
                                            batsman_id: String(p.batsman_id ?? ''),
                                            name: String(p.name ?? ''),
                                            runs: String(p.runs ?? ''),
                                            balls: String(p.balls ?? ''),
                                        }))
                                        : [],
                                }
                                : null,
                        }))
                        : [],
                },
            },
            { upsert: true }
        );
        console.log('Scorecards Updated!');
    } catch (error) {
        console.error('❌ Error updating live scorecard:', error.message);
    }
};