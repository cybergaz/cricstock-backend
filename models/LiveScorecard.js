import mongoose from 'mongoose';

const batsmanSchema = new mongoose.Schema({
    batsman_id: { type: String, default: '' },
    name: { type: String, default: '' },
    batting: { type: String, default: '' },
    position: { type: String, default: '' },
    role: { type: String, default: '' },
    role_str: { type: String, default: '' },
    runs: { type: String, default: '' },
    balls_faced: { type: String, default: '' },
    fours: { type: String, default: '' },
    sixes: { type: String, default: '' },
    run0: { type: String, default: '' },
    run1: { type: String, default: '' },
    run2: { type: String, default: '' },
    run3: { type: String, default: '' },
    run5: { type: String, default: '' },
    how_out: { type: String, default: '' },
    dismissal: { type: String, default: '' },
    strike_rate: { type: String, default: '' },
    bowler_id: { type: String, default: '' },
    first_fielder_id: { type: String, default: '' },
    second_fielder_id: { type: String, default: '' },
    third_fielder_id: { type: String, default: '' },
}, { _id: false });

const bowlerSchema = new mongoose.Schema({
    bowler_id: { type: String, default: '' },
    name: { type: String, default: '' },
    bowling: { type: String, default: '' },
    position: { type: String, default: '' },
    overs: { type: String, default: '' },
    maidens: { type: String, default: '' },
    runs_conceded: { type: String, default: '' },
    wickets: { type: String, default: '' },
    noballs: { type: String, default: '' },
    wides: { type: String, default: '' },
    econ: { type: String, default: '' },
    run0: { type: String, default: '' },
    bowledcount: { type: String, default: '' },
    lbwcount: { type: String, default: '' },
}, { _id: false });

const fowSchema = new mongoose.Schema({
    batsman_id: { type: String, default: '' },
    name: { type: String, default: '' },
    runs: { type: String, default: '' },
    balls: { type: String, default: '' },
    how_out: { type: String, default: '' },
    score_at_dismissal: { type: String, default: '' },
    overs_at_dismissal: { type: String, default: '' },
    bowler_id: { type: String, default: '' },
    dismissal: { type: String, default: '' },
    number: { type: String, default: '' },
}, { _id: false });

const lastWicketSchema = new mongoose.Schema({
    batsman_id: { type: String, default: '' },
    name: { type: String, default: '' },
    runs: { type: String, default: '' },
    balls: { type: String, default: '' },
    how_out: { type: String, default: '' },
    score_at_dismissal: { type: String, default: '' },
    overs_at_dismissal: { type: String, default: '' },
    bowler_id: { type: String, default: '' },
    dismissal: { type: String, default: '' },
    number: { type: String, default: '' },
}, { _id: false });

const extraRunsSchema = new mongoose.Schema({
    byes: { type: String, default: '' },
    legbyes: { type: String, default: '' },
    wides: { type: String, default: '' },
    noballs: { type: String, default: '' },
    penalty: { type: String, default: '' },
    total: { type: String, default: '' },
}, { _id: false });

const equationsSchema = new mongoose.Schema({
    runs: { type: String, default: '' },
    wickets: { type: String, default: '' },
    overs: { type: String, default: '' },
    bowlers_used: { type: String, default: '' },
    runrate: { type: String, default: '' },
}, { _id: false });

const partnershipBatsmanSchema = new mongoose.Schema({
    batsman_id: { type: String, default: '' },
    name: { type: String, default: '' },
    runs: { type: String, default: '' },
    balls: { type: String, default: '' },
}, { _id: false });

const currentPartnershipSchema = new mongoose.Schema({
    runs: { type: String, default: '' },
    balls: { type: String, default: '' },
    overs: { type: String, default: '' },
    batsmen: { type: [partnershipBatsmanSchema], default: [] },
}, { _id: false });

const inningsSchema = new mongoose.Schema({
    iid: { type: String, default: '' },
    number: { type: String, default: '' },
    name: { type: String, default: '' },
    short_name: { type: String, default: '' },
    status: { type: String, default: '' },
    issuperover: { type: String, default: '' },
    result: { type: String, default: '' },
    batting_team_id: { type: String, default: '' },
    fielding_team_id: { type: String, default: '' },
    scores: { type: String, default: '' },
    scores_full: { type: String, default: '' },
    batsmen: { type: [batsmanSchema], default: [] },
    bowlers: { type: [bowlerSchema], default: [] },
    fow: { type: [fowSchema], default: [] },
    last_wicket: { type: lastWicketSchema, default: () => ({}) },
    extra_runs: { type: extraRunsSchema, default: () => ({}) },
    equations: { type: equationsSchema, default: () => ({}) },
    max_over: { type: String, default: '' },
    target: { type: String, default: '' },
    current_partnership: { type: currentPartnershipSchema, default: () => ({}) },
}, { _id: false });

const liveScorecardSchema = new mongoose.Schema({
    match_id: String,
    title: String,
    short_title: String,
    subtitle: String,
    match_number: String,
    format: String,
    format_str: String,
    status: String,
    status_str: String,
    status_note: String,
    verified: String,
    pre_squad: String,
    odds_available: String,
    game_state: String,
    game_state_str: String,
    domestic: String,
    current_over: String,
    previous_over: String,
    man_of_the_series: String,
    is_followon: String,
    team_batting_first: String,
    team_batting_second: String,
    last_five_overs: String,
    date_start: String,
    date_end: String,
    timestamp_start: String,
    timestamp_end: String,
    date_start_ist: String,
    date_end_ist: String,
    umpires: String,
    referee: String,
    equation: String,
    live: String,
    result: String,
    result_type: String,
    win_margin: String,
    winning_team_id: String,
    commentary: String,
    wagon: String,
    latest_inning_number: String,
    presquad_time: String,
    verify_time: String,
    match_dls_affected: String,
    day: String,
    session: String,
    day_remaining_over: String,

    competition: {
        cid: { type: String, default: '' },
        title: { type: String, default: '' },
        abbr: { type: String, default: '' },
        type: { type: String, default: '' },
        category: { type: String, default: '' },
        match_format: { type: String, default: '' },
        season: { type: String, default: '' },
        status: { type: String, default: '' },
        datestart: { type: String, default: '' },
        dateend: { type: String, default: '' },
        country: { type: String, default: '' },
        total_matches: { type: String, default: '' },
        total_rounds: { type: String, default: '' },
        total_teams: { type: String, default: '' },
    },

    man_of_the_match: {
        pid: { type: String, default: '' },
        name: { type: String, default: '' },
        thumb_url: { type: String, default: '' },
    },

    teama: {
        team_id: { type: String, default: '' },
        name: { type: String, default: '' },
        short_name: { type: String, default: '' },
        logo_url: { type: String, default: '' },
        scores_full: { type: String, default: '' },
        scores: { type: String, default: '' },
        overs: { type: String, default: '' },
    },

    teamb: {
        team_id: { type: String, default: '' },
        name: { type: String, default: '' },
        short_name: { type: String, default: '' },
        logo_url: { type: String, default: '' },
        scores_full: { type: String, default: '' },
        scores: { type: String, default: '' },
        overs: { type: String, default: '' },
    },

    venue: {
        venue_id: { type: String, default: '' },
        name: { type: String, default: '' },
        location: { type: String, default: '' },
        country: { type: String, default: '' },
        timezone: { type: String, default: '' },
    },

    weather: {
        weather: { type: String, default: '' },
        weather_desc: { type: String, default: '' },
        temp: { type: String, default: '' },
        humidity: { type: String, default: '' },
        visibility: { type: String, default: '' },
        wind_speed: { type: String, default: '' },
        clouds: { type: String, default: '' },
    },

    pitch: {
        pitch_condition: { type: String, default: '' },
        batting_condition: { type: String, default: '' },
        pace_bowling_condition: { type: String, default: '' },
        spine_bowling_condition: { type: String, default: '' },
    },

    innings: { type: [inningsSchema], default: [] },
});

export default mongoose.model('LiveScorecards', liveScorecardSchema);