import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
    name: { type: String },
    netAmount: { type: Number },
});


const Company = mongoose.model("Company", CompanySchema);

export { Company };
