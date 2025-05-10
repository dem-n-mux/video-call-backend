const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Babble User" },
    bio: { type: String, default: "Yes, This Is Babble User" },
    identity: String,
    uniqueID: { type: String, unique: true },
    fcm_token: { type: String, default: null },
    email: { type: String, default: "Babble@gmail.com" },
    password: { type: String, default: null },
    token: { type: String, default: null },
    channel: { type: String, default: null },
    gender: { type: String, default: "Female" },
    dob: { type: String, default: "01-01-2000" },
    image: { type: String, default: null },
    country: { type: String, default: "" },
    loginType: { type: Number, enum: [0, 1, 2, 3] }, //0.quick  1. google 2. fake login 3. custom login
    lastLogin: String,
    platformType: { type: Number, enum: [0, 1], default: 0 }, //0.android  1.ios
    isOnline: { type: Boolean, default: false },
    isBusy: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    isHost: { type: Boolean, default: false },
    isSignup: { type: Boolean, default: false },
    age: { type: Number, default: 0 },
    date: String,
    mobileNumber: { type: String, default: null },

    coin: { type: Number, default: 0 },
    purchasedCoin: { type: Number, default: 0 },

    isCoinPlan: { type: Boolean, default: false }, // for coinPlan purchase
    plan: {
      planStartDate: { type: String, default: null }, // coinPlan start date
      coinPlanId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    liveStreamingId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveStreamingHistory", default: null },
    agoraUid: { type: Number, default: 0 },

    referralCode: { type: String, default: null },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("User", userSchema);
