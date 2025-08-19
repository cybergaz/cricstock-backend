import { User } from "../models/User.js";
import Todays from "../models/Todays.js";

// Send current match data to a client
const sendCurrentMatchData = async (ws) => {
  try {
    const matches = await Todays.find({}).lean();

    if (matches && matches.length > 0) {
      ws.send(JSON.stringify({
        type: 'initial_matches',
        data: matches
      }));
    }
    // ----------------------------------------------
    // NOTE: you might need to send the scorecard data from DB as well because on first load it will not have scorecard data
    // ----------------------------------------------
  } catch (error) {
    console.error(`Error sending current match data: ${error.message}`);
  }
};

const sendCurrentPortfolioData = async (ws) => {
  try {
    if (!ws.userId) {
      console.warn('No user ID found for portfolio data request');
      return;
    }

    // Get user's portfolio data (you'll need to implement this)
    const portfolioData = await getUserPortfolioData(ws.userId);

    ws.send(JSON.stringify({
      type: 'portfolio_update',
      data: portfolioData
    }));
  } catch (error) {
    console.error(`Error sending portfolio data: ${error.message}`);
  }
};

// const getUserPortfolioData = async (userId) => {
//   // This should return the same structure as your current portfolio data
//   try {
//
//     // Get user's portfolio data
//     const user = await User.findById(userId);
//     if (!user) {
//       console.warn(`User not found for ID: ${userId}`);
//       return;
//     }
//
//     // Extract active portfolios
//     const playerPortfolios = user.playerPortfolios.filter(p => p.status === "Buy");
//     const teamPortfolios = user.teamPortfolios.filter(p => p.status === "Buy");
//
//     // Get portfolio history
//     const playerHistory = user.playerPortfolios.filter(p => p.status === "Sold");
//     const teamHistory = user.teamPortfolios.filter(p => p.status === "Sold");
//
//     // calculate sum of total profit and loss for player and team history
//     const totalProfit = [...playerHistory, ...teamHistory].reduce((sum, p) => sum + Number(p.profit), 0);
//
//     return{
//       success: true,
//       message: "Portfolios Fetched",
//       playerPortfolios: activePlayers,
//       playerHistory: paginatedPlayerHistory,
//       playerHistoryPagination: {
//         currentPage: pageNum,
//         totalPages: Math.ceil(totalHistoryCount / limitNum),
//         totalItems: totalHistoryCount,
//         itemsPerPage: limitNum,
//         hasNextPage: skip + limitNum < totalHistoryCount,
//         hasPrevPage: pageNum > 1
//       },
//       teamPortfolios: activeTeams,
//       teamHistory,
//       totalPortfolioProfit,
//       value: (Number(user.amount) + Number(user.referralAmount)),
//       profit: totalProfits
//     }
//
//
//   }
//   catch (error) {
//     console.error(`Error fetching portfolio data for user ${userId}: ${error.message}`);
//   }
// };

export { sendCurrentMatchData, sendCurrentPortfolioData };
