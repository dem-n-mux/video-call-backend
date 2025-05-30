//import model
const User = require("../user/model");
const Host = require("../host/host.model");
const Block = require("../block/block.model");
const RandomHistory = require("../randomHistory/randomHistory.model");

//mongoose
const mongoose = require("mongoose");

//get random match
exports.match = async (req, res) => {
  try {
    if (!req.query.type || !req.query.userId) {
      return res.status(200).json({ status: false, message: "Type and UserId must be requried!!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, blockHost] = await Promise.all([User.findById(userId), Block.find({ userId: userId }).distinct("hostId")]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!!" });
    }

    if (user.coin < settingJSON.chargeForRandomCall) {
      console.log("you don't have sufficient coin.");

      return res.status(200).json({ status: false, message: "you don't have sufficient coin." });
    }

    var randomHosts;
    if (req.query.type === "female") {
      randomHosts = await Host.find({
        _id: { $nin: blockHost },
        gender: "Female",
        isOnline: true,
        isBusy: false,
        isConnect: false,
        isLive: false,
      });
    } else if (req.query.type === "male") {
      randomHosts = await Host.find({
        _id: { $nin: blockHost },
        gender: "Male",
        isOnline: true,
        isBusy: false,
        isConnect: false,
        isLive: false,
      });
    } else if (req.query.type === "both") {
      randomHosts = await Host.find({
        _id: { $nin: blockHost },
        isOnline: true,
        isConnect: false,
        isBusy: false,
        isLive: false,
      });
    }

    if (randomHosts.length > 0) {
      //randomMatch history
      const randomHistory = new RandomHistory();
      randomHistory.userId = user._id;
      randomHistory.hostId = randomHosts[0]._id;
      randomHistory.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      await randomHistory.save();

      return res.status(200).json({ status: true, message: "Success!!", data: randomHosts[0] }); //emit in callerId is User
    } else {
      return res.status(200).json({ status: true, message: "No one is online!!", data: null }); //emit in callerId is User
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};
