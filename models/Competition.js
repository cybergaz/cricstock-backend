import mongoose from "mongoose";

const competitionSchema = new mongoose.Schema({
  id: { type: Number },
  title: { type: String},
  short_title: { type: String  },
  type: { type: String  },
  category: { type: String  },
  match_format: { type: String },
  status: { type: String  },
  season: { type: Number  },
  datestart: { type: Date },
  dateend: { type: Date  },
  country: { type: String },
  total_matches: { type: Number },
  total_teams: { type: Number },
});

export default mongoose.model("Competition", competitionSchema);