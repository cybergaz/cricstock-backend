import mongoose from 'mongoose';

const Scorecards = new mongoose.Schema({
  match_id: { type: String, required: true, index: true },
  
  // Team stock prices
  teamStockPrices: {
    teama: { type: Number, default: 50 },
    teamb: { type: Number, default: 50 }
  },
  
  innings: [{
    iid: { type: Number },
    number: { type: Number },
    name: { type: String },
    short_name: { type: String },
    status: { type: Number },
    issuperover: { type: String },
    result: { type: Number },
    batting_team_id: { type: Number },
    fielding_team_id: { type: Number },
    scores: { type: String },
    scores_full: { type: String },
    
    batsmen: [{
      name: { type: String },
      batsman_id: { type: String },
      role: { type: String },
      role_str: { type: String },
      runs: { type: String },
      balls_faced: { type: String },
      fours: { type: String },
      sixes: { type: String },
      run0: { type: String },
      run1: { type: String },
      run2: { type: String },
      run3: { type: String },
      run5: { type: String },
      how_out: { type: String },
      dismissal: { type: String },
      strike_rate: { type: String },
      batting: { type: String },
      position: { type: String },
      bowler_id: { type: String },
      first_fielder_id: { type: String },
      second_fielder_id: { type: String },
      third_fielder_id: { type: String },
      currentPrice: { type: Number, default: 0 } // Store the calculated player price
    }],
    
    bowlers: [{
      name: { type: String },
      bowler_id: { type: String },
      overs: { type: String },
      maidens: { type: String },
      runs_conceded: { type: String },
      wickets: { type: String },
      economy: { type: String },
      bowling: { type: String },
      extras: { type: String },
      noballs: { type: String },
      wides: { type: String },
      dots: { type: String }
    }],
    
    extras: {
      wides: { type: Number },
      noballs: { type: Number },
      byes: { type: Number },
      legbyes: { type: Number },
      penalty: { type: Number },
      total: { type: Number }
    },
    
    equations: {
      runs: { type: Number },
      wickets: { type: Number },
      overs: { type: Number },
      runrate: { type: Number }
    },
    
    fows: [{
      name: { type: String },
      score: { type: String },
      wicket: { type: String },
      over: { type: String },
      batsman_id: { type: String },
      how_out: { type: String },
      bowler_id: { type: String },
      number: { type: Number }
    }],
    
    last_wicket: {
      name: { type: String },
      score: { type: String },
      wicket: { type: String },
      over: { type: String },
      batsman_id: { type: String },
      how_out: { type: String },
      bowler_id: { type: String },
      number: { type: Number }
    },
    
    partnerships: [{
      runs: { type: Number },
      balls: { type: Number },
      overs: { type: Number },
      batsmen: [{
        name: { type: String },
        batsman_id: { type: String },
        runs: { type: Number },
        balls: { type: Number }
      }]
    }]
  }],
  
  teama: {
    team_id: { type: String },
    name: { type: String },
    short_name: { type: String },
    logo_url: { type: String },
    thumb_url: { type: String },
    scores_full: { type: String },
    scores: { type: String },
    overs: { type: String }
  },
  
  teamb: {
    team_id: { type: String },
    name: { type: String },
    short_name: { type: String },
    logo_url: { type: String },
    thumb_url: { type: String },
    scores_full: { type: String },
    scores: { type: String },
    overs: { type: String }
  },
  
  is_followon: { type: Boolean },
  day_remaining_over: { type: Number },
  status: { type: String },
  status_str: { type: String },
  status_note: { type: String },
  result: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Scorecards', Scorecards);
