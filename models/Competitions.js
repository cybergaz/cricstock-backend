import mongoose from 'mongoose';

const Competitions = new mongoose.Schema({
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
});

export default mongoose.model('Competitions', Competitions);
