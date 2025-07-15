import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: { type: String },
  totalProfits: { type: Number },
  profitFromPlatformFees: { type: Number },
  profitFromProfitableCuts: { type: Number },
});


const Company = mongoose.model("Company", CompanySchema);

export { Company };
