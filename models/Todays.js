import mongoose from 'mongoose';

const Todays = new mongoose.Schema({
  match_id: { type: Number, default: 0 },
  title: { type: String, default: '' },
  short_title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  match_number: { type: String, default: '' },
  format: { type: Number, default: 0 },
  format_str: { type: String, default: '' },
  status: { type: Number, default: 0 },
  status_str: { type: String, default: '' },
  status_note: { type: String, default: '' },
  game_state: { type: Number, default: 0 },
  game_state_str: { type: String, default: '' },
  verified: { type: String, default: '' },
  pre_squad: { type: String, default: '' },
  odds_available: { type: String, default: '' },
  domestic: { type: String, default: '' },
  competition: {
    cid: { type: Number, default: 0 },
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
    team_id: { type: Number, default: 0 },
    name: { type: String, default: '' },
    short_name: { type: String, default: '' },
    logo_url: { type: String, default: '' },
    thumb_url: { type: String, default: '' },
    scores_full: { type: String, default: '' },
    scores: { type: String, default: '' },
    overs: { type: String, default: '' },
  },
  teamb: {
    team_id: { type: Number, default: 0 },
    name: { type: String, default: '' },
    short_name: { type: String, default: '' },
    logo_url: { type: String, default: '' },
    thumb_url: { type: String, default: '' },
    scores_full: { type: String, default: '' },
    scores: { type: String, default: '' },
    overs: { type: String, default: '' },
  },
  date_start: { type: String, default: '' },
  date_end: { type: String, default: '' },
  timestamp_start: { type: Number, default: 0 },
  timestamp_end: { type: Number, default: 0 },
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
  result: { type: String, default: '' },
  result_type: { type: Number, default: 0 },
  win_margin: { type: String, default: '' },
  winning_team_id: { type: Number, default: 0 },
  commentary: { type: Number, default: 0 },
  wagon: { type: Number, default: 0 },
  latest_inning_number: { type: Number, default: 0 },
  presquad_time: { type: String, default: '' },
  verify_time: { type: String, default: '' },
  day: { type: String, default: '' },
  session: { type: String, default: '' },
  oddstype: { type: String, default: '' },
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
    winner: { type: Number, default: 0 },
    decision: { type: Number, default: 0 },
  },
  // New fields from sample data
  match_playing11: {
    teama: {
      team_id: { type: Number, default: 0 },
      squads: [{
        player_id: { type: String, default: '' },
        substitute: { type: String, default: 'false' },
        out: { type: String, default: 'false' },
        in: { type: String, default: 'false' },
        role_str: { type: String, default: '' },
        role: { type: String, default: '' },
        playing11: { type: String, default: 'false' },
        name: { type: String, default: '' }
      }]
    },
    teamb: {
      team_id: { type: Number, default: 0 },
      squads: [{
        player_id: { type: String, default: '' },
        substitute: { type: String, default: 'false' },
        out: { type: String, default: 'false' },
        in: { type: String, default: 'false' },
        role_str: { type: String, default: '' },
        role: { type: String, default: '' },
        playing11: { type: String, default: 'false' },
        name: { type: String, default: '' }
      }]
    }
  },
  man_of_the_match: { type: Array, default: [] },
  man_of_the_series: { type: Array, default: [] },
  scorecard: {
    innings: [{
      iid: { type: Number, default: 0 },
      number: { type: Number, default: 0 },
      name: { type: String, default: '' },
      short_name: { type: String, default: '' },
      status: { type: Number, default: 0 },
      issuperover: { type: String, default: 'false' },
      result: { type: Number, default: 0 },
      batting_team_id: { type: Number, default: 0 },
      fielding_team_id: { type: Number, default: 0 },
      scores: { type: String, default: '' },
      scores_full: { type: String, default: '' },
      batsmen: [{
        name: { type: String, default: '' },
        batsman_id: { type: String, default: '' },
        batting: { type: String, default: 'false' },
        position: { type: String, default: '' },
        role: { type: String, default: '' },
        role_str: { type: String, default: '' },
        runs: { type: String, default: '' },
        balls_faced: { type: String, default: '' },
        fours: { type: String, default: '' },
        sixes: { type: String, default: '' },
        run0: { type: String, default: '' },
        how_out: { type: String, default: '' },
        dismissal: { type: String, default: '' },
        strike_rate: { type: String, default: '' },
        bowler_id: { type: String, default: '' },
        first_fielder_id: { type: String, default: '' },
        second_fielder_id: { type: String, default: '' },
        third_fielder_id: { type: String, default: '' }
      }],
      bowlers: [{
        name: { type: String, default: '' },
        bowler_id: { type: String, default: '' },
        bowling: { type: String, default: 'false' },
        position: { type: String, default: '' },
        overs: { type: String, default: '' },
        maidens: { type: String, default: '' },
        runs_conceded: { type: String, default: '' },
        wickets: { type: String, default: '' },
        noballs: { type: String, default: '' },
        wides: { type: String, default: '' },
        econ: { type: String, default: '' },
        run0: { type: String, default: '' }
      }],
      fielder: [{
        fielder_id: { type: String, default: '' },
        fielder_name: { type: String, default: '' },
        catches: { type: Number, default: 0 },
        stumping: { type: Number, default: 0 },
        is_substitute: { type: String, default: 'false' }
      }],
      powerplay: {
        p1: {
          startover: { type: String, default: '' },
          endover: { type: String, default: '' }
        }
      },
      fows: [{
        name: { type: String, default: '' },
        batsman_id: { type: String, default: '' },
        runs: { type: String, default: '' },
        balls: { type: String, default: '' },
        how_out: { type: String, default: '' },
        score_at_dismissal: { type: Number, default: 0 },
        overs_at_dismissal: { type: String, default: '' },
        bowler_id: { type: String, default: '' },
        dismissal: { type: String, default: '' },
        number: { type: Number, default: 0 }
      }],
      last_wicket: {
        name: { type: String, default: '' },
        batsman_id: { type: String, default: '' },
        runs: { type: String, default: '' },
        balls: { type: String, default: '' },
        how_out: { type: String, default: '' },
        score_at_dismissal: { type: Number, default: 0 },
        overs_at_dismissal: { type: String, default: '' },
        bowler_id: { type: String, default: '' },
        dismissal: { type: String, default: '' },
        number: { type: Number, default: 0 }
      },
      extra_runs: {
        byes: { type: Number, default: 0 },
        legbyes: { type: Number, default: 0 },
        wides: { type: Number, default: 0 },
        noballs: { type: Number, default: 0 },
        penalty: { type: String, default: '0' },
        total: { type: Number, default: 0 }
      },
      equations: {
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        overs: { type: String, default: '' },
        bowlers_used: { type: Number, default: 0 },
        runrate: { type: String, default: '' }
      },
      current_partnership: {
        runs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 },
        overs: { type: Number, default: 0 },
        batsmen: [{
          name: { type: String, default: '' },
          batsman_id: { type: Number, default: 0 },
          runs: { type: Number, default: 0 },
          balls: { type: Number, default: 0 }
        }]
      },
      did_not_bat: [{
        player_id: { type: String, default: '' },
        name: { type: String, default: '' }
      }],
      max_over: { type: String, default: '' },
      recent_scores: { type: String, default: '' },
      last_five_overs: { type: String, default: '' },
      last_ten_overs: { type: String, default: '' }
    }],
    is_followon: { type: Number, default: 0 },
    day_remaining_over: { type: String, default: '' }
  },
  live: {
    mid: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    status_str: { type: String, default: '' },
    game_state: { type: Number, default: 0 },
    game_state_str: { type: String, default: '' },
    status_note: { type: String, default: '' },
    team_batting: { type: String, default: '' },
    team_bowling: { type: String, default: '' },
    live_inning_number: { type: Number, default: 0 },
    live_score: {
      runs: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      target: { type: Number, default: 0 },
      runrate: { type: Number, default: 0 },
      required_runrate: { type: String, default: '' }
    },
    batsmen: [{
      name: { type: String, default: '' },
      batsman_id: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      balls_faced: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      strike_rate: { type: String, default: '' }
    }],
    bowlers: [{
      name: { type: String, default: '' },
      bowler_id: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      runs_conceded: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      econ: { type: String, default: '' }
    }],
    commentaries: [{
      event_id: { type: String, default: '' },
      event: { type: String, default: '' },
      batsman_id: { type: String, default: '' },
      bowler_id: { type: String, default: '' },
      over: { type: String, default: '' },
      ball: { type: String, default: '' },
      score: { type: mongoose.Schema.Types.Mixed, default: 0 },
      commentary: { type: String, default: '' },
      noball_dismissal: { type: Boolean, default: false },
      text: { type: String, default: '' },
      timestamp: { type: Number, default: 0 },
      run: { type: Number, default: 0 },
      noball_run: { type: String, default: '0' },
      wide_run: { type: String, default: '0' },
      bye_run: { type: String, default: '0' },
      legbye_run: { type: String, default: '0' },
      bat_run: { type: String, default: '0' },
      odds: { type: mongoose.Schema.Types.Mixed, default: null },
      six: { type: Boolean, default: false },
      four: { type: Boolean, default: false },
      freehit: { type: Boolean, default: false },
      xball: { type: Number, default: 0 },
      wicket_batsman_id: { type: String, default: '' },
      how_out: { type: String, default: '' },
      batsman_runs: { type: String, default: '' },
      batsman_balls: { type: String, default: '' }
    }],
    live_inning: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  live_odds: {
    matchodds: {
      teama: {
        back: { type: String, default: '' },
        lay: { type: String, default: '' },
        back_volume: { type: String, default: '' },
        lay_volume: { type: String, default: '' }
      },
      teamb: {
        back: { type: String, default: '' },
        lay: { type: String, default: '' },
        back_volume: { type: String, default: '' },
        lay_volume: { type: String, default: '' }
      }
    },
    tiedmatch: {
      teama: {
        back: { type: String, default: '' },
        lay: { type: String, default: '' },
        back_volume: { type: String, default: '' },
        lay_volume: { type: String, default: '' }
      },
      teamb: {
        back: { type: String, default: '' },
        lay: { type: String, default: '' },
        back_volume: { type: String, default: '' },
        lay_volume: { type: String, default: '' }
      }
    },
    bookmaker: {
      teama: {
        back: { type: String, default: '' },
        lay: { type: String, default: '' },
        back_volume: { type: String, default: '' },
        lay_volume: { type: String, default: '' }
      },
      teamb: {
        back: { type: String, default: '' },
        lay: { type: String, default: '' },
        back_volume: { type: String, default: '' },
        lay_volume: { type: String, default: '' }
      }
    }
  },
  teamwinpercentage: {
    team_a_win: { type: String, default: '' },
    team_b_win: { type: String, default: '' },
    draw: { type: String, default: '' }
  },
  session_odds: [{
    question_id: { type: Number, default: 0 },
    team_batting: { type: String, default: '' },
    title: { type: String, default: '' },
    back_condition: { type: String, default: '' },
    back: { type: String, default: '' },
    lay_condition: { type: String, default: '' },
    lay: { type: String, default: '' },
    status: { type: String, default: '' },
    category: { type: String, default: '' }
  }],
  featured_session: [{
    question_id: { type: Number, default: 0 },
    team_batting: { type: String, default: '' },
    title: { type: String, default: '' },
    back_condition: { type: String, default: '' },
    back: { type: String, default: '' },
    lay_condition: { type: String, default: '' },
    lay: { type: String, default: '' },
    status: { type: String, default: '' },
    over: { type: String, default: '' }
  }],
  players: [{
    pid: { type: Number, default: 0 },
    title: { type: String, default: '' },
    short_name: { type: String, default: '' },
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    middle_name: { type: String, default: '' },
    birthdate: { type: String, default: '' },
    birthplace: { type: String, default: '' },
    country: { type: String, default: '' },
    logo_url: { type: String, default: '' },
    playing_role: { type: String, default: '' },
    batting_style: { type: String, default: '' },
    bowling_style: { type: String, default: '' },
    fielding_position: { type: String, default: '' },
    facebook_profile: { type: String, default: '' },
    twitter_profile: { type: String, default: '' },
    instagram_profile: { type: String, default: '' },
    bowling_type: { type: String, default: '' },
    nationality: { type: String, default: '' }
  }]
});

export default mongoose.model('Todays', Todays); 
