import mongoose from "mongoose";

const scheduledMatchesSchema = new mongoose.Schema({
    match_id: { type: String },

    title: { type: String },
    short_title: { type: String },
    match_title: { type: String },
    match_number: { type: String },
    format: { type: String },
    status: { type: String },

    competition: {
        cid: { type: String },
        title: { type: String },
        short_title: { type: String },
        type: { type: String },
        category: { type: String },
        status: { type: String },
        datestart: { type: String },
        dateend: { type: String },
    },

    teama: {
        team_id: { type: String },
        name: { type: String },
        short_name: { type: String },
        logo_url: { type: String },
    },
    teamb: {
        team_id: { type: String },
        name: { type: String },
        short_name: { type: String },
        logo_url: { type: String },
    },
    date_start: { type: String },
    date_end: { type: String },
    timestamp_start: { type: String },
    timestamp_end: { type: String },
    date_start_ist: { type: String },
    date_end_ist: { type: String },

    venue: {
        venue_id: { type: String },
        name: { type: String },
        location: { type: String },
        country: { type: String },
        timezone: { type: String }
    },
    weather: {
        weather: { type: String },
        weather_desc: { type: String },
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
});

export default mongoose.model("ScheduledMatches", scheduledMatchesSchema);