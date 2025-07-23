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
        profitFromAutoSell: 0
      });
      await company.save();
    }

    const { player, price, quantity, match_id } = req.body;

    let bucket = quantity * price
    let pointOnePercent = bucket * 0.001;

    if (pointOnePercent < 5) {
      pointOnePercent = 5
    } else if (pointOnePercent > 20) {
      pointOnePercent = 20
    }

    if ((bucket + pointOnePercent) > user.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance, Balance ₹${user.amount}`,
      });
    }

    company.profitFromPlatformFees += pointOnePercent;
    company.totalProfits += pointOnePercent;
    await company.save();

    bucket += pointOnePercent;

    user.amount -= bucket;
    // -----------------------------------------------------------------------------

    if (!Array.isArray(user.playerPortfolios)) {
      user.playerPortfolios = [];
    }

    // const totalCost = Number(quantity) * Number(price) + platformFee
    const playerIdStr = String(player.batsman_id).trim();
    const matchIdStr = String(match_id).trim();
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
    console.log("-----------------------------------------------------------")
    console.log("price -> ", price)
    console.log("quantity -> ", quantity)

    let bucket = quantity * price
    console.log("bucket -> ", bucket)
    let pointOnePercent = bucket * 0.001;
    console.log("pointOnePercent -> ", pointOnePercent)

    if (pointOnePercent < 5) {
      pointOnePercent = 5
    } else if (pointOnePercent > 20) {
      pointOnePercent = 20
    }
    console.log("pointOnePercent final -> ", pointOnePercent)

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
    console.log("boughtPrice -> ", portfolio.boughtPrice)
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
    console.log("--------------------------")
    console.log("qtyToSell -> ", qtyToSell)
    console.log("sellPrice -> ", sellPrice)
    console.log("totalSellAmount -> ", totalSellAmount)
    let totalBuyAmount = qtyToSell * buyPrice;
    console.log("buyPrice -> ", buyPrice)
    console.log("totalBuyAmount -> ", totalBuyAmount)
    const userProfitOrLoss = totalSellAmount - totalBuyAmount;
    console.log("userProfitOrLoss -> ", userProfitOrLoss)

    let profitCut = 0;
    let companyFeeType = "";

    if (userProfitOrLoss > 0) {
      // 5% of profit
      profitCut = userProfitOrLoss * 0.05;
      console.log("profitCut -> ", profitCut)
      companyFeeType = "profitFromProfitableCuts";
      // update user amount in db
      user.amount += totalSellAmount - (profitCut + pointOnePercent);
      console.log("user amount += -> ", totalSellAmount - (profitCut + pointOnePercent))
    } else {
      profitCut = userProfitOrLoss;
      console.log("profitCut -> ", profitCut)
      companyFeeType = "profitFromPlatformFees";
      // update user amount in db
      user.amount += totalSellAmount - pointOnePercent;
      console.log("user amount += -> ", totalSellAmount - pointOnePercent)
      profitCut = Math.abs(profitCut)
    }

    // Update company profit
    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({ name: "cricstock11", totalProfits: 0, profitFromPlatformFees: 0, profitFromProfitableCuts: 0, profitFromAutoSell: 0 });
    }

    company.totalProfits += profitCut + pointOnePercent;
    console.log("totalProfits += -> ", profitCut + pointOnePercent)
    company.profitFromProfitableCuts += profitCut;
    console.log("profitFromProfitableCuts -> ", profitCut)
    company.profitFromPlatformFees += pointOnePercent;
    console.log("profitFromPlatformFees -> ", pointOnePercent)

    if (sellPrice == buyPrice * 0.5) {
      company.profitFromAutoSell += buyPrice * 0.5
    }
    // if (companyFeeType === "profitFromProfitableCuts") {
    //   company.profitFromProfitableCuts = (company.profitFromProfitableCuts || 0) + fee;
    // } else {
    //   company.profitFromPlatformFees = (company.profitFromPlatformFees || 0) + fee;
    // }
    await company.save();
    console.log("company saved")

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
    const user = await User.findById(req.user.userId).select();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }
    const playerPortfolios = (user.playerPortfolios || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    const teamPortfolios = (user.teamPortfolios || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    const depositedAmount = Array.isArray(user.transactions)
      ? user.transactions
        .filter(txn => txn.type === "Deposit" && txn.status === "Completed")
        .reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0)
      : 0;
    const playerProfits = (user.playerPortfolios || [])
      .filter(p => p.status == "Sold")
      .reduce((sum, p) => sum + ((Number(p.profit) || 0)), 0);
    const teamProfits = (user.teamPortfolios || [])
      .filter(p => p.status == "Sold")
      .reduce((sum, p) => sum + ((Number(p.profit) || 0)), 0);
    const totalProfits = playerProfits + teamProfits
    // Fetch today's portfolios from DB
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;


    // Calculate total profit and loss from all portfolios
    let totalPlayerProfit = 0;
    let totalTeamProfit = 0;
    if (Array.isArray(user.playerPortfolios)) {
      totalPlayerProfit = user.playerPortfolios
        .filter(p => p.status === "Sold")
        .reduce((sum, p) => sum + (Number(p.profit) || 0), 0);
    }
    if (Array.isArray(user.teamPortfolios)) {
      totalTeamProfit = user.teamPortfolios
        .filter(p => p.status === "Sold")
        .reduce((sum, p) => sum + (Number(p.profit) || 0), 0);
    }
    const totalPortfolioProfit = totalPlayerProfit + totalTeamProfit;
    res.status(200).json({
      success: true,
      message: "Portfolios Fetched",
      playerPortfolios,
      totalPortfolioProfit,
      teamPortfolios,
      value: user.amount,
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







/*-------------------------------- Upcoming Feature -------------------------------------------------------*/
router.post("/buy-team", authMiddleware, async (req, res) => {
  try {
    return
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

    let company = await Company.findOne({ name: "cricstock11" });
    if (!company) {
      company = new Company({
        name: "cricstock11",
        totalProfits: 0
      });
      await company.save();
    }
    const { team, price, quantity, match_id } = req.body;
    const onePercent = Number(quantity) * Number(price) * 0.01;
    company.totalProfits += onePercent
    await company.save();
    if (!Array.isArray(user.teamPortfolios)) {
      user.teamPortfolios = [];
    }
    if (user.amount < quantity * price) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance, Balance ₹${user.amount}`,
      });
    }
    // Normalize for comparison
    const teamIdStr = String(team.batsman_id).trim();
    const matchIdStr = String(match_id).trim();
    const qtyToAdd = Number(quantity);
    const buyPrice = Number(price);
    // Find if portfolio exists
    const portfolioIndex = user.teamPortfolios.findIndex(
      (portfolio) => String(portfolio.teamId).trim() === teamIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
    );
    if (portfolioIndex !== -1) {
      // Update existing entry: increment quantity, recalculate average price
      let portfolio = user.teamPortfolios[portfolioIndex];
      const prevQty = Number(portfolio.quantity) || 0;
      const prevPrice = Number(portfolio.boughtPrice) || 0;
      const newQty = prevQty + qtyToAdd;
      // Weighted average price
      const avgPrice = ((prevQty * prevPrice) + (qtyToAdd * buyPrice)) / newQty;
      portfolio.quantity = String(newQty);
      portfolio.boughtPrice = avgPrice.toFixed(2);
      // Profit and percentage (if soldPrice exists)
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
      // Create new entry
      const teamPortfolio = {
        matchId: match_id,
        teamId: team.batsman_id,
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

    const amountToDeduct = quantity * price;
    if (typeof user.amount === "undefined" || isNaN(Number(user.amount))) {
      user.amount = 0;
    }
    user.amount = Number(user.amount) - amountToDeduct;

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
    return
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

    const { team, price, quantity, match_id } = req.body;
    if (!Array.isArray(user.teamPortfolios)) {
      user.teamPortfolios = [];
    }
    // Normalize for comparison
    const teamIdStr = String(team.batsman_id).trim();
    const matchIdStr = String(match_id).trim();
    const qtyToSell = Number(quantity);
    const sellPrice = Number(price);
    // Find if portfolio exists and is not already sold
    const portfolioIndex = user.teamPortfolios.findIndex(
      (portfolio) => String(portfolio.teamId).trim() === teamIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
    );
    if (portfolioIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No Current Holding"
      });
    }
    // Update the found portfolio entry with new data from req
    let portfolio = user.teamPortfolios[portfolioIndex];
    // Calculate profit and profitPercentage
    const buyPrice = Number(portfolio.boughtPrice) || 0;
    const quantityHeld = Number(portfolio.quantity) || 0;
    let profit = "";
    let profitPercentage = "";
    if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
      profit = ((sellPrice - buyPrice) * quantityHeld).toFixed(2);
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
    const amountToAdd = qtyToSell * sellPrice;
    if (typeof user.amount === "undefined" || isNaN(Number(user.amount))) {
      user.amount = 0;
    }
    // Calculate profit for this sell
    let profitOnSell = (sellPrice - buyPrice) * qtyToSell;
    let companyShare = 0;
    if (profitOnSell > 0) {
      companyShare = profitOnSell * 0.05;
    }
    // Deduct company share from amount to add to user
    const amountToAddAfterCompany = amountToAdd - companyShare;
    user.amount = Number(user.amount) + amountToAddAfterCompany;

    if (companyShare > 0) {
      let company = await Company.findOne({});
      if (!company) {
        company = new Company({ name: "Main", totalProfits: 0 });
      }
      company.totalProfits += companyShare;
      await company.save();
    }

    user.amount = Number(user.amount) + amountToAdd;

    if (qtyToSell === quantityHeld) {
      // Sell the entire holding as before
      portfolio.soldPrice = price;
      portfolio.status = "Sold";
      portfolio.reason = "";
      portfolio.timestamp = String(new Date());
      portfolio.profit = profit;
      portfolio.profitPercentage = profitPercentage;
      soldMessage = `${portfolio.teamName || team.batsman_id}'s ${qtyToSell} Stock(s) Sold @ ₹${price}`;
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
      user.teamPortfolios.push(soldPortfolio);
      soldMessage = `${portfolio.teamName || team.batsman_id}'s ${qtyToSell} Stock(s) Sold @ ₹${price}`;
    }
    await user.save();
    res.status(200).json({
      success: true,
      message: soldMessage,
      amountAdded: amountToAdd,
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

export default router;
