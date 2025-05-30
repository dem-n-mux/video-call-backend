const mongoose = require("mongoose");

const rattingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "host" },
    rate: Number,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rattingSchema.index({ userId: 1 });
rattingSchema.index({ hostId: 1 });

module.exports = mongoose.model("Ratting", rattingSchema);
