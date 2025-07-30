import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: { type: String, default: "cricstock11" },
  totalProfits: { type: Number, default: 0 },
  totalTdsCut: { type: Number, default: 0 },
  profitFromPlatformFees: { type: Number, default: 0 },
  profitFromAutoSell: { type: Number, default: 0 },
  profitFromProfitableCuts: { type: Number, default: 0 },
  profitFromUserLoss: { type: Number, default: 0 }
});


const Company = mongoose.model("Company", CompanySchema);

export { Company };
