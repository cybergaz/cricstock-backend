import mongoose from 'mongoose';

const Todays = new mongoose.Schema({
    match_id: { type: String, default: '' },
    title: { type: String, default: '' },
    short_title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    match_number: { type: String, default: '' },
    format: { type: String, default: '' },
    format_str: { type: String, default: '' },
    status: { type: String, default: '' },
    status_str: { type: String, default: '' },
    status_note: { type: String, default: '' },
    verified: { type: String, default: '' },
    pre_squad: { type: String, default: '' },
    odds_available: { type: String, default: '' },
    game_state: { type: String, default: '' },
    game_state_str: { type: String, default: '' },
    domestic: { type: String, default: '' },
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
    teama: {
        team_id: { type: String, default: '' },
        name: { type: String, default: '' },
        short_name: { type: String, default: '' },
        logo_url: { type: String, default: '' },
        scores_full: { type: String, default: '' },
        overs: { type: String, default: '' },
    },
    teamb: {
        team_id: { type: String, default: '' },
        name: { type: String, default: '' },
        short_name: { type: String, default: '' },
        logo_url: { type: String, default: '' },
        scores_full: { type: String, default: '' },
        overs: { type: String, default: '' },
    },
    date_start: { type: String, default: '' },
    date_end: { type: String, default: '' },
    timestamp_start: { type: String, default: '' },
    timestamp_end: { type: String, default: '' },
    date_start_ist: { type: String, default: '' },
    date_end_ist: { type: String, default: '' },
    venue: {
        venue_id: { type: String, default: '' },
        name: { type: String, default: '' },
        location: { type: String, default: '' },
        country: { type: String, default: '' },
        timezone: { type: String, default: '' },
    },
    umpires: { type: String, default: '' },
    referee: { type: String, default: '' },
    equation: { type: String, default: '' },
    live: { type: String, default: '' },
    result: { type: String, default: '' },
    result_type: { type: String, default: '' },
    win_margin: { type: String, default: '' },
    winning_team_id: { type: String, default: '' },
    commentary: { type: String, default: '' },
    wagon: { type: String, default: '' },
    latest_inning_number: { type: String, default: '' },
    presquad_time: { type: String, default: '' },
    verify_time: { type: String, default: '' },
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
    toss: {
        text: { type: String, default: '' },
        winner: { type: String, default: '' },
        decision: { type: String, default: '' },
    }
});

export default mongoose.model('Todays', Todays); 