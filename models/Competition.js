import mongoose from "mongoose";

const competitionSchema = new mongoose.Schema({
  cid: { type: String },
  title: { type: String },
  short_title: { type: String },
  type: { type: String },
  category: { type: String },
  match_format: { type: String },
  status: { type: String },
  season: { type: String },
  datestart: { type: String },
  dateend: { type: String },
  country: { type: String },
  total_matches: { type: String },
  total_teams: { type: String },
});

export default mongoose.model("Competitions", competitionSchema);