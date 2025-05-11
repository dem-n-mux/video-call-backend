const mongoose = require("mongoose");

const redeemPlanSchema = new mongoose.Schema(
  {
    coin: Number,
    dollar: Number,
    platFormType: { type: Number, enum: [0, 1], default: 0 }, //0.android  1.ios
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("RedeemPlan", redeemPlanSchema);
