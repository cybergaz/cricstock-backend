import mongoose from "mongoose";

const livescoreSchema = new mongoose.Schema({
    mid: { type: String },
    status: { type: String },
    status_note: { type: String },
    team_batting: { type: String },
    team_bowling: { type: String },
    live_score: {
        runs: { type: String },
        overs: { type: String },
        wickets: { type: String },
        target: { type: String },
        runrate: { type: String },
        required_runrate: { type: String }
    },
    batsmen: {
        id: { type: String },
        name: { type: String },
        runs: { type: String },
        balls_faced: { type: String },
        fours: { type: String },
        sixes: { type: String },
        strike_rate: { type: String }
    },
    bowlers: {
        id: { type: String },
        name: { type: String },
        overs: { type: String },
        runs_conceded: { type: String },
        wickets: { type: String },
        maidens: { type: String },
        econ: { type: String }
    },
    live_inning: {
        id: String,
        name: String,
        status: String,
        batting_team_id: String,
        fielding_team_id: String,
        scores: String,
        last_wicket: {
            name: String,
            batsman_id: String,
            runs: String,
            balls: String,
            how_out: String,
            score_at_dismissal: String,
            overs_at_dismissal: String,
        },
        extra_runs: {
            byes: String,
            legbyes: String,
            wides: String,
            noballs: String,
            penalty: String,
            total: String
        },
        current_partnership: {
            runs: String,
            balls: String,
            overs: String,
            batsmen: [{
                name: String,
                batsman_id: String,
                runs: String,
                balls: String
            }]
        },
        did_not_bat: [{
            player_id: String,
            name: String
        }],
        max_over: String,
        target: String,
        recent_scores: String,
    },
    teams: [{
        id: String,
        name: String,
        short_name: String,
        thumb_url: String,
        logo_url: String,
        head_coach: String,
        score: String,
    }]
    , players: [{
        id: Number,
        first_name: String,
        middle_name: String,
        last_name: String,
        short_name: String,
        birthdate: String,
        birthplace: String,
        country: String,
        playing_role: String,
        batting_style: String,
        bowling_style: String,
        bowling_type: String,
    }]
});

export default mongoose.model("Livescore", livescoreSchema);