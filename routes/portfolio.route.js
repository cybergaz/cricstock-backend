import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js"
import { User } from "../models/User.js";
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

        const { player, price, quantity, match_id } = req.body;
        if (!Array.isArray(user.playerPortfolios)) {
            user.playerPortfolios = [];
        }
        // Normalize for comparison
        const playerIdStr = String(player.batsman_id).trim();
        const matchIdStr = String(match_id).trim();
        const qtyToAdd = Number(quantity);
        const buyPrice = Number(price);
        // Find if portfolio exists
        const portfolioIndex = user.playerPortfolios.findIndex(
            (portfolio) => String(portfolio.playerId).trim() === playerIdStr && String(portfolio.matchId).trim() === matchIdStr && portfolio.status !== "Sold"
        );
        if (portfolioIndex !== -1) {
            // Update existing entry: increment quantity, recalculate average price
            let portfolio = user.playerPortfolios[portfolioIndex];
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
            message: "error in buying player stock"
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

        const { player, price, quantity, match_id } = req.body;
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
        });
    } catch (err) {
        console.error("error in selling player stock:", err);
        res.status(500).json({
            success: false,
            message: "error in selling player stock"
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
        res.status(200).json({
            success: true,
            message: "Portfolios Fetched",
            playerPortfolios: user.playerPortfolios || [],
            teamPortfolios: user.teamPortfolios || []
        });
    } catch (err) {
        console.error("error in fetching portfolios:", err);
        res.status(500).json({
            success: false,
            message: "error in fetching portfolios"
        });
    }
});


export default router;
