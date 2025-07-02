import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
    id: { type: Number, required: true },

    title: { type: String },
    short_title: { type: String },
    match_title: { type: String },
    match_number: { type: String },
    format: { type: Number },
    status: { type: Number },
    result: { type: String },

    competition: {
        id: { type: Number },
        title: { type: String },
        short_title: { type: String },
        type: { type: String },
        category: { type: String },
        match_format: { type: String },
        status: { type: String },
        datestart: { type: String },
        dateend: { type: String },
        country: { type: String },
        total_matches: { type: String },
    },

    teama: {
        id: { type: Number },
        name: { type: String },
        short_name: { type: String },
        logo_url: { type: String },
        scores_full: { type: String },
        scores: { type: String },
        overs: { type: String }
    },

    teamb: {
        id: { type: Number },
        name: { type: String },
        short_name: { type: String },
        logo_url: { type: String },
        scores_full: { type: String },
        scores: { type: String },
        overs: { type: String }
    },

    date_start: { type: String },
    date_end: { type: String },
    timestamp_start: { type: Number },
    timestamp_end: { type: Number },
    date_start_ist: { type: String },
    date_end_ist: { type: String },

    venue: {
        id: { type: String },
        name: { type: String },
        location: { type: String },
        country: { type: String },
        timezone: { type: String }
    },

    umpires: { type: String },
    referee: { type: String },
    result: { type: String },
    win_margin: { type: String },
    winning_team_id: { type: Number },
    presquad_time: { type: String },
    verify_time: { type: String },
    match_dls_affected: { type: String },

    weather: {
        weather: { type: String },
        weather_description: { type: String },
        temp: { type: String },
        humidity: { type: String },
        visibility: { type: String },
        wind_speed: { type: String },
        clouds: { type: String },
    },

    pitch: {
        pitch_condition: { type: String },
        batting_condition: { type: String },
        pace_bowling_condition: { type: String },
        spine_bowling_condition: { type: String }
    },

    toss: {
        result: { type: String },
        winner_team_id: { type: Number },
    }
});

export default mongoose.model("Match", matchSchema);