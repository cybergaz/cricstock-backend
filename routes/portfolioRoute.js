import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js"
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
const router = express.Router();



router.post("/buy-player", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }
    const user = await User.findById(req.user.userId).select();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }

    if (typeof user.amount === "undefined" || isNaN(Number(user.amount))) {
      user.amount = 0;
    }

    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({
        name: "cricstock11",
        totalProfits: 0,
        profitFromPlatformFees: 0,
        profitFromProfitableCuts: 0,
        profitFromUserLoss: 0,
        profitFromAutoSell: 0
      });
      await company.save();
    }

    const { player, price, quantity, match_id } = req.body;

    // Check player investment limit (₹25,000 max per player)
    const playerIdStr = String(player.batsman_id).trim();
    const matchIdStr = String(match_id).trim();

    // Find current holdings for this player
    const currentHoldings = user.playerPortfolios.filter(portfolio =>
      String(portfolio.playerId).trim() === playerIdStr &&
      String(portfolio.matchId).trim() === matchIdStr &&
      portfolio.status !== "Sold"
    );

    // Calculate total current investment in this player
    let totalCurrentInvestment = 0;
    for (const holding of currentHoldings) {
      const quantity = Number(holding.quantity) || 0;
      const price = Number(holding.boughtPrice) || 0;
      totalCurrentInvestment += quantity * price;
    }

    // Calculate new investment amount
    const newInvestment = Number(quantity) * Number(price);
    const totalInvestmentAfterPurchase = totalCurrentInvestment + newInvestment;
    const maxInvestment = 25000;

    if (totalInvestmentAfterPurchase > maxInvestment) {
      const remainingInvestment = Math.max(0, maxInvestment - totalCurrentInvestment);
      const maxQuantity = Math.floor(remainingInvestment / Number(price));

      return res.status(400).json({
        success: false,
        message: `Investment limit exceeded. You can only invest ₹${remainingInvestment.toFixed(2)} more in this player (max ${maxQuantity} stocks at current price).`,
        remainingInvestment: remainingInvestment.toFixed(2),
        maxQuantity
      });
    }

    let bucket = quantity * price
    let pointOnePercent = bucket * 0.001;

    if (pointOnePercent < 5) {
      pointOnePercent = 5
    } else if (pointOnePercent > 20) {
      pointOnePercent = 20
    }

    if ((bucket + pointOnePercent) > (user.amount + user.referralAmount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance, Balance ₹${user.amount}`,
      });
    }

    company.profitFromPlatformFees += pointOnePercent;
    company.totalProfits += pointOnePercent;
    await company.save();

    bucket += pointOnePercent;

    if (user.referralAmount >= bucket) {
      user.referralAmount -= bucket;
    } else {
      const remaining = bucket - user.referralAmount;
      user.referralAmount = 0;
      user.amount -= remaining;
    }
    // -----------------------------------------------------------------------------

    if (!Array.isArray(user.playerPortfolios)) {
      user.playerPortfolios = [];
    }

    // const totalCost = Number(quantity) * Number(price) + platformFee
    const qtyToAdd = Number(quantity);
    const buyPrice = Number(price);
    const portfolioIndex = user.playerPortfolios.findIndex(
      (portfolio) => String(portfolio.playerId).trim() === playerIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
    );
    if (portfolioIndex !== -1) {
      let portfolio = user.playerPortfolios[portfolioIndex];
      const prevQty = Number(portfolio.quantity) || 0;
      const prevPrice = Number(portfolio.boughtPrice) || 0;
      const newQty = prevQty + qtyToAdd;
      const avgPrice = ((prevQty * prevPrice) + (qtyToAdd * buyPrice)) / newQty;
      portfolio.quantity = String(newQty);
      portfolio.boughtPrice = avgPrice.toFixed(2);
      let profit = "";
      let profitPercentage = "";
      if (portfolio.soldPrice) {
        const sell = Number(portfolio.soldPrice);
        profit = ((sell - avgPrice) * newQty).toFixed(2);
        profitPercentage = avgPrice !== 0 ? (((sell - avgPrice) / avgPrice) * 100).toFixed(2) : "";
      }
      portfolio.profit = profit;
      portfolio.profitPercentage = profitPercentage;
      portfolio.timestamp = String(new Date());
    } else {
      const playerPortfolio = {
        matchId: match_id,
        playerId: player.batsman_id,
        playerName: player.name,
        quantity: String(quantity),
        boughtPrice: price,
        soldPrice: "",
        profit: "",
        profitPercentage: "",
        status: "Buy",
        reason: "",
        timestamp: String(new Date()),
      };
      user.playerPortfolios.push(playerPortfolio);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `${player.name}'s ${quantity} Stock Bought @ ₹${price}`,
    });

  } catch (err) {
    console.error("error in buying player stock:", err);
    res.status(500).json({
      success: false,
      message: "Updating...."
    });
  }
});

router.post("/sell-player", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }
    const user = await User.findById(req.user.userId).select();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }

    if (typeof user.amount === "undefined" || isNaN(Number(user.amount))) {
      user.amount = 0;
    }

    const { player, price, quantity, match_id } = req.body;
    // console.log("-----------------------------------------------------------")
    // console.log("price -> ", price)
    // console.log("quantity -> ", quantity)

    let bucket = quantity * price
    // console.log("bucket -> ", bucket)
    let pointOnePercent = bucket * 0.001;
    // console.log("pointOnePercent -> ", pointOnePercent)

    if (pointOnePercent < 5) {
      pointOnePercent = 5
    } else if (pointOnePercent > 20) {
      pointOnePercent = 20
    }
    // console.log("pointOnePercent final -> ", pointOnePercent)

    if (!Array.isArray(user.playerPortfolios)) {
      user.playerPortfolios = [];
    }
    // Normalize for comparison
    const playerIdStr = String(player.batsman_id).trim();
    const matchIdStr = String(match_id).trim();
    const qtyToSell = Number(quantity);
    const sellPrice = Number(price);
    // Find if portfolio exists and is not already sold
    const portfolioIndex = user.playerPortfolios.findIndex(
      (portfolio) => String(portfolio.playerId).trim() === playerIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
    );
    if (portfolioIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No Current Holding"
      });
    }
    // Update the found portfolio entry with new data from req
    let portfolio = user.playerPortfolios[portfolioIndex];
    // Calculate profit and profitPercentage
    const buyPrice = Number(portfolio.boughtPrice) || 0;
    // console.log("boughtPrice -> ", portfolio.boughtPrice)
    const quantityHeld = Number(portfolio.quantity) || 0;
    let profit = "";
    let profitPercentage = "";
    if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
      profit = ((sellPrice - buyPrice) * qtyToSell).toFixed(2);
      profitPercentage = buyPrice !== 0 ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2) : "";
    }
    // Check if requested quantity to sell is greater than available
    if (qtyToSell > quantityHeld) {
      return res.status(400).json({
        success: false,
        message: `You only have ${quantityHeld} stocks available to sell.`
      });
    }

    let soldMessage = "";
    // Calculate the amount to add to user's amount
    let totalSellAmount = qtyToSell * sellPrice;
    // console.log("--------------------------")
    // console.log("qtyToSell -> ", qtyToSell)
    // console.log("sellPrice -> ", sellPrice)
    // console.log("totalSellAmount -> ", totalSellAmount)
    let totalBuyAmount = qtyToSell * buyPrice;
    // console.log("buyPrice -> ", buyPrice)
    // console.log("totalBuyAmount -> ", totalBuyAmount)
    const userProfitOrLoss = totalSellAmount - totalBuyAmount;
    // console.log("userProfitOrLoss -> ", userProfitOrLoss)

    let tdsCut = 0;
    let profitCut = 0;
    let profitFrom5cut = 0;
    let profitFromUserLoss = 0;
    let companyFeeType = "";

    if (userProfitOrLoss > 0) {
      // 5% of profit
      tdsCut = userProfitOrLoss * 0.3;
      profitCut = userProfitOrLoss * 0.05;
      profitFrom5cut = profitCut;
      // console.log("profitCut -> ", profitCut)
      companyFeeType = "profitFromProfitableCuts";
      // update user amount in db
      user.amount += totalSellAmount - (tdsCut + profitCut + pointOnePercent);
      // console.log("user amount += -> ", totalSellAmount - (profitCut + pointOnePercent))
    } else {
      profitCut = userProfitOrLoss;
      // console.log("profitCut -> ", profitCut)
      companyFeeType = "profitFromPlatformFees";
      // update user amount in db
      user.amount += totalSellAmount - pointOnePercent;
      // console.log("user amount += -> ", totalSellAmount - pointOnePercent)
      profitCut = Math.abs(profitCut)
      profitFromUserLoss = profitCut;
    }

    // Update company profit
    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({ name: "cricstock11", totalProfits: 0, totalTdsCut: 0, profitFromPlatformFees: 0, profitFromProfitableCuts: 0, profitFromUserLoss: 0, profitFromAutoSell: 0 });
    }

    company.totalProfits += tdsCut + profitCut + pointOnePercent;
    // console.log("totalProfits += -> ", profitCut + pointOnePercent)
    company.totalTdsCut += tdsCut;
    company.profitFromProfitableCuts += profitFrom5cut;
    company.profitFromUserLoss += profitFromUserLoss;
    // console.log("profitFromProfitableCuts -> ", profitCut)
    company.profitFromPlatformFees += pointOnePercent;
    // console.log("profitFromPlatformFees -> ", pointOnePercent)

    if (sellPrice == buyPrice * 0.5) {
      company.profitFromAutoSell += buyPrice * 0.5
    }
    // if (companyFeeType === "profitFromProfitableCuts") {
    //   company.profitFromProfitableCuts = (company.profitFromProfitableCuts || 0) + fee;
    // } else {
    //   company.profitFromPlatformFees = (company.profitFromPlatformFees || 0) + fee;
    // }
    await company.save();
    // console.log("company saved")

    if (qtyToSell === quantityHeld) {
      // Sell the entire holding as before
      portfolio.soldPrice = price;
      portfolio.status = "Sold";
      portfolio.reason = "";
      portfolio.timestamp = String(new Date());
      portfolio.profit = profit;
      portfolio.profitPercentage = profitPercentage;
      soldMessage = `${portfolio.playerName || player.batsman_id}'s ${qtyToSell} Stock(s) Sold @ ₹${price}`;
    } else {
      // Partial sell: split the portfolio
      portfolio.quantity = String(quantityHeld - qtyToSell);
      const soldPortfolio = {
        ...portfolio.toObject ? portfolio.toObject() : portfolio,
        quantity: String(qtyToSell),
        soldPrice: price,
        status: "Sold",
        reason: "",
        timestamp: String(new Date()),
        profit: ((sellPrice - buyPrice) * qtyToSell).toFixed(2),
        profitPercentage: buyPrice !== 0 ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2) : "",
      };
      user.playerPortfolios.push(soldPortfolio);
      soldMessage = `${portfolio.playerName || player.batsman_id}'s ${qtyToSell} Stock(s) Sold @ ₹${price}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: soldMessage,
      amountAdded: totalSellAmount - pointOnePercent,
      newAmount: user.amount
    });

  } catch (err) {
    console.error("error in selling player stock:", err);
    res.status(500).json({
      success: false,
      message: "Updating...."
    });
  }
});


router.get("/all", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Use aggregation pipeline for optimized queries
    const user = await User.findById(req.user.userId).select();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }

    // Optimized processing using array methods
    const allPlayerPortfolios = (user.playerPortfolios || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Separate active and history portfolios efficiently
    const activePlayers = [];
    const playerHistory = [];

    for (const portfolio of allPlayerPortfolios) {
      if ((portfolio.status || "").toLowerCase() === "buy") {
        activePlayers.push(portfolio);
      } else {
        playerHistory.push(portfolio);
      }
    }

    // Apply pagination to history
    const totalHistoryCount = playerHistory.length;
    const paginatedPlayerHistory = playerHistory.slice(skip, skip + limitNum);

    // Process team portfolios
    const teamPortfolios = (user.teamPortfolios || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const activeTeams = [];
    const teamHistory = [];

    for (const portfolio of teamPortfolios) {
      if ((portfolio.status || "").toLowerCase() === "buy") {
        activeTeams.push(portfolio);
      } else {
        teamHistory.push(portfolio);
      }
    }

    // Calculate profits efficiently in single pass
    let playerProfits = 0;
    let teamProfits = 0;

    for (const portfolio of playerHistory) {
      playerProfits += Number(portfolio.profit) || 0;
    }

    for (const portfolio of teamHistory) {
      teamProfits += Number(portfolio.profit) || 0;
    }

    const totalProfits = playerProfits + teamProfits;

    // Calculate total portfolio profit from sold portfolios
    let totalPortfolioProfit = 0;

    // Sum profits from sold player portfolios
    if (Array.isArray(user.playerPortfolios)) {
      for (const portfolio of user.playerPortfolios) {
        if (portfolio.status === "Sold" && portfolio.profit) {
          totalPortfolioProfit += Number(portfolio.profit) || 0;
        }
      }
    }

    // Sum profits from sold team portfolios
    if (Array.isArray(user.teamPortfolios)) {
      for (const portfolio of user.teamPortfolios) {
        if (portfolio.status === "Sold" && portfolio.profit) {
          totalPortfolioProfit += Number(portfolio.profit) || 0;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Portfolios Fetched",
      playerPortfolios: activePlayers,
      playerHistory: paginatedPlayerHistory,
      playerHistoryPagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalHistoryCount / limitNum),
        totalItems: totalHistoryCount,
        itemsPerPage: limitNum,
        hasNextPage: skip + limitNum < totalHistoryCount,
        hasPrevPage: pageNum > 1
      },
      teamPortfolios: activeTeams,
      teamHistory,
      totalPortfolioProfit,
      value: (Number(user.amount) + Number(user.referralAmount)),
      profit: totalProfits
    });
  } catch (err) {
    console.error("error in fetching portfolios:", err);
    res.status(500).json({
      success: false,
      message: "error in fetching portfolios"
    });
  }
});




router.post("/buy-team", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }
    const user = await User.findById(req.user.userId).select();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }

    if (typeof user.amount === "undefined" || isNaN(Number(user.amount))) {
      user.amount = 0;
    }

    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({
        name: "cricstock11",
        totalProfits: 0,
        profitFromPlatformFees: 0,
        profitFromProfitableCuts: 0,
        profitFromUserLoss: 0,
        profitFromAutoSell: 0
      });
      await company.save();
    }

    const { team, price, quantity, match_id } = req.body;

    // Check team investment limit (₹25,000 max per team)
    const teamIdStr = String(team.team_id).trim();
    const matchIdStr = String(match_id).trim();

    // Find current holdings for this team
    const currentHoldings = user.teamPortfolios.filter(portfolio =>
      String(portfolio.team).trim() === teamIdStr &&
      String(portfolio.matchId).trim() === matchIdStr &&
      portfolio.status !== "Sold"
    );

    // Calculate total current investment in this team
    let totalCurrentInvestment = 0;
    for (const holding of currentHoldings) {
      const quantity = Number(holding.quantity) || 0;
      const price = Number(holding.boughtPrice) || 0;
      totalCurrentInvestment += quantity * price;
    }

    // Calculate new investment amount
    const newInvestment = Number(quantity) * Number(price);
    const totalInvestmentAfterPurchase = totalCurrentInvestment + newInvestment;
    const maxInvestment = 25000;

    if (totalInvestmentAfterPurchase > maxInvestment) {
      const remainingInvestment = Math.max(0, maxInvestment - totalCurrentInvestment);
      const maxQuantity = Math.floor(remainingInvestment / Number(price));

      return res.status(400).json({
        success: false,
        message: `Investment limit exceeded. You can only invest ₹${remainingInvestment.toFixed(2)} more in this team (max ${maxQuantity} stocks at current price).`,
        remainingInvestment: remainingInvestment.toFixed(2),
        maxQuantity
      });
    }

    let bucket = quantity * price
    let pointOnePercent = bucket * 0.001;

    if (pointOnePercent < 5) {
      pointOnePercent = 5
    } else if (pointOnePercent > 20) {
      pointOnePercent = 20
    }

    if ((bucket + pointOnePercent) > (user.amount + user.referralAmount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance, Balance ₹${user.amount}`,
      });
    }

    company.profitFromPlatformFees += pointOnePercent;
    company.totalProfits += pointOnePercent;
    await company.save();

    bucket += pointOnePercent;

    if (user.referralAmount >= bucket) {
      user.referralAmount -= bucket;
    } else {
      const remaining = bucket - user.referralAmount;
      user.referralAmount = 0;
      user.amount -= remaining;
    }

    if (!Array.isArray(user.teamPortfolios)) {
      user.teamPortfolios = [];
    }

    const qtyToAdd = Number(quantity);
    const buyPrice = Number(price);
    const portfolioIndex = user.teamPortfolios.findIndex(
      (portfolio) => String(portfolio.team).trim() === teamIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
    );

    if (portfolioIndex !== -1) {
      let portfolio = user.teamPortfolios[portfolioIndex];
      const prevQty = Number(portfolio.quantity) || 0;
      const prevPrice = Number(portfolio.boughtPrice) || 0;
      const newQty = prevQty + qtyToAdd;
      const avgPrice = ((prevQty * prevPrice) + (qtyToAdd * buyPrice)) / newQty;
      portfolio.quantity = String(newQty);
      portfolio.boughtPrice = avgPrice.toFixed(2);
      let profit = "";
      let profitPercentage = "";
      if (portfolio.soldPrice) {
        const sell = Number(portfolio.soldPrice);
        profit = ((sell - avgPrice) * newQty).toFixed(2);
        profitPercentage = avgPrice !== 0 ? (((sell - avgPrice) / avgPrice) * 100).toFixed(2) : "";
      }
      portfolio.profit = profit;
      portfolio.profitPercentage = profitPercentage;
      portfolio.timestamp = String(new Date());
    } else {
      const teamPortfolio = {
        matchId: match_id,
        team: team.team_id,
        teamName: team.name,
        quantity: String(quantity),
        boughtPrice: price,
        soldPrice: "",
        profit: "",
        profitPercentage: "",
        status: "Buy",
        reason: "",
        timestamp: String(new Date()),
      };
      user.teamPortfolios.push(teamPortfolio);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `${team.name}'s ${quantity} Stock Bought @ ₹${price}`,
    });
  } catch (err) {
    console.error("error in buying team stock:", err);
    res.status(500).json({
      success: false,
      message: "Updating...."
    });
  }
});

router.post("/sell-team", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }
    const user = await User.findById(req.user.userId).select();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }

    if (typeof user.amount === "undefined" || isNaN(Number(user.amount))) {
      user.amount = 0;
    }

    const { team, price, quantity, match_id } = req.body;

    let bucket = quantity * price
    let pointOnePercent = bucket * 0.001;

    if (pointOnePercent < 5) {
      pointOnePercent = 5
    } else if (pointOnePercent > 20) {
      pointOnePercent = 20
    }

    if (!Array.isArray(user.teamPortfolios)) {
      user.teamPortfolios = [];
    }

    const teamIdStr = String(team.team_id).trim();
    const matchIdStr = String(match_id).trim();
    const qtyToSell = Number(quantity);
    const sellPrice = Number(price);

    const portfolioIndex = user.teamPortfolios.findIndex(
      (portfolio) => String(portfolio.team).trim() === teamIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
    );

    if (portfolioIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No Current Holding"
      });
    }

    let portfolio = user.teamPortfolios[portfolioIndex];
    const buyPrice = Number(portfolio.boughtPrice) || 0;
    const quantityHeld = Number(portfolio.quantity) || 0;
    let profit = "";
    let profitPercentage = "";
    if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
      profit = ((sellPrice - buyPrice) * quantityHeld).toFixed(2);
      profitPercentage = buyPrice !== 0 ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2) : "";
    }

    if (qtyToSell > quantityHeld) {
      return res.status(400).json({
        success: false,
        message: `You only have ${quantityHeld} stocks available to sell.`
      });
    }

    let soldMessage = "";
    let totalSellAmount = qtyToSell * sellPrice;
    let totalBuyAmount = qtyToSell * buyPrice;
    const userProfitOrLoss = totalSellAmount - totalBuyAmount;

    let tdsCut = 0;
    let profitCut = 0;
    let profitFrom5cut = 0;
    let profitFromUserLoss = 0;
    let companyFeeType = "";

    if (userProfitOrLoss > 0) {
      // 30% TDS of profit
      tdsCut = userProfitOrLoss * 0.3;
      // 5% of remaining profit after TDS
      profitCut = userProfitOrLoss * 0.05;
      profitFrom5cut = profitCut;
      companyFeeType = "profitFromProfitableCuts";
      // update user amount in db
      user.amount += totalSellAmount - (tdsCut + profitCut + pointOnePercent);
    } else {
      profitCut = userProfitOrLoss;
      companyFeeType = "profitFromPlatformFees";
      // update user amount in db
      user.amount += totalSellAmount - pointOnePercent;
      profitCut = Math.abs(profitCut)
      profitFromUserLoss = profitCut;
    }

    // Update company profit
    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({ name: "cricstock11", totalProfits: 0, totalTdsCut: 0, profitFromPlatformFees: 0, profitFromProfitableCuts: 0, profitFromUserLoss: 0, profitFromAutoSell: 0 });
    }

    company.totalProfits += tdsCut + profitCut + pointOnePercent;
    company.totalTdsCut += tdsCut;
    company.profitFromProfitableCuts += profitFrom5cut;
    company.profitFromUserLoss += profitFromUserLoss;
    company.profitFromPlatformFees += pointOnePercent;

    if (sellPrice == buyPrice * 0.5) {
      company.profitFromAutoSell += buyPrice * 0.5
    }

    await company.save();

    if (qtyToSell === quantityHeld) {
      portfolio.soldPrice = price;
      portfolio.status = "Sold";
      portfolio.reason = "";
      portfolio.timestamp = String(new Date());
      portfolio.profit = profit;
      portfolio.profitPercentage = profitPercentage;
      soldMessage = `${portfolio.teamName || team.team_id}'s ${qtyToSell} Stock(s) Sold @ ₹${price}`;
    } else {
      portfolio.quantity = String(quantityHeld - qtyToSell);
      const soldPortfolio = {
        ...portfolio.toObject ? portfolio.toObject() : portfolio,
        quantity: String(qtyToSell),
        soldPrice: price,
        status: "Sold",
        reason: "",
        timestamp: String(new Date()),
        profit: ((sellPrice - buyPrice) * qtyToSell).toFixed(2),
        profitPercentage: buyPrice !== 0 ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2) : "",
      };
      user.teamPortfolios.push(soldPortfolio);
      soldMessage = `${portfolio.teamName || team.team_id}'s ${qtyToSell} Stock(s) Sold @ ₹${price}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: soldMessage,
      amountAdded: totalSellAmount - pointOnePercent,
      newAmount: user.amount
    });
  } catch (err) {
    console.error("error in selling team stock:", err);
    res.status(500).json({
      success: false,
      message: "Updating...."
    });
  }
});

// Route to auto-sell player portfolios when player gets out
router.post("/auto-sell-player-portfolios/:matchId/:playerId", async (req, res) => {
  try {
    const { matchId, playerId } = req.params;

    // Find all users with active holdings for this player in this match
    const users = await User.find({
      "playerPortfolios": {
        $elemMatch: {
          "matchId": matchId,
          "playerId": playerId,
          "status": "Buy"
        }
      }
    });

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No player portfolios to auto-sell"
      });
    }

    // Get company for profit tracking
    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({
        name: "cricstock11",
        totalProfits: 0,
        totalTdsCut: 0,
        profitFromPlatformFees: 0,
        profitFromProfitableCuts: 0,
        profitFromUserLoss: 0,
        profitFromAutoSell: 0
      });
    }

    let totalAutoSold = 0;
    let totalAutoSellAmount = 0;

    for (const user of users) {
      // Find active portfolios for this player in this match
      const activePortfolios = user.playerPortfolios.filter(portfolio =>
        String(portfolio.matchId).trim() === String(matchId).trim() &&
        String(portfolio.playerId).trim() === String(playerId).trim() &&
        portfolio.status === "Buy"
      );

      for (const portfolio of activePortfolios) {
        const quantityHeld = Number(portfolio.quantity) || 0;
        const buyPrice = Number(portfolio.boughtPrice) || 0;

        if (quantityHeld > 0 && buyPrice > 0) {
          // Auto-sell at 50% of buying price
          const autoSellPrice = buyPrice * 0.5;
          const totalSellAmount = quantityHeld * autoSellPrice;
          const totalBuyAmount = quantityHeld * buyPrice;
          const loss = totalBuyAmount - totalSellAmount;

          // Calculate platform fee (0.1% of sell amount, min 5, max 20)
          let platformFee = totalSellAmount * 0.001;
          if (platformFee < 5) platformFee = 5;
          else if (platformFee > 20) platformFee = 20;

          // Update user amount (user gets sell amount minus platform fee)
          user.amount += totalSellAmount - platformFee;

          // Update portfolio
          portfolio.soldPrice = autoSellPrice.toFixed(2);
          portfolio.status = "Sold";
          portfolio.reason = "Player Out - Auto Sold";
          portfolio.timestamp = String(new Date());
          portfolio.profit = (-loss).toFixed(2); // Negative for loss
          portfolio.profitPercentage = buyPrice !== 0 ? ((-loss / totalBuyAmount) * 100).toFixed(2) : "";

          // Update company profits
          company.profitFromPlatformFees += platformFee;
          company.profitFromAutoSell += buyPrice * 0.5; // Auto-sell fee
          company.totalProfits += platformFee + (buyPrice * 0.5);

          totalAutoSold++;
          totalAutoSellAmount += totalSellAmount;
        }
      }

      await user.save();
    }

    await company.save();

    res.status(200).json({
      success: true,
      message: `Auto-sold ${totalAutoSold} player portfolios`,
      data: {
        totalAutoSold,
        totalAutoSellAmount: totalAutoSellAmount.toFixed(2)
      }
    });

  } catch (error) {
    console.error("Error auto-selling player portfolios:", error);
    res.status(500).json({
      success: false,
      message: "Error auto-selling player portfolios",
      error: error.message
    });
  }
});

export default router;
