const RedeemPlan = require("./redeemPlan.model");

// import model
const User = require("../user/model");
const History = require("../history/history.model");

//create Coin Plan
exports.store = async (req, res) => {
  try {
    if (!req.body.dollar || req.body.platFormType < 0 || !req.body.coin) {
      return res.status(200).json({ status: false, message: "Invalid Details!!" });
    }

    const redeemPlan = new RedeemPlan();

    redeemPlan.coin = req.body.coin;
    redeemPlan.dollar = req.body.dollar;
    redeemPlan.platFormType = parseInt(req.body.platFormType);
    await redeemPlan.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      redeemPlan,
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get active Coin Plan
exports.appPlan = async (req, res) => {
  try {
    const redeemPlan = await RedeemPlan.find({ isActive: true });

    return res.status(200).json({
      status: true,
      message: "Success!!",
      redeemPlan,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get all Coin Plan
exports.index = async (req, res) => {
  try {
    const redeemPlan = await RedeemPlan.find().sort({ coin: 1 });

    return res.status(200).json({
      status: true,
      message: "Success!!!",
      redeemPlan,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//update Coin Plan
exports.update = async (req, res) => {
  try {
    if (!req.query.planId) {
      return res.status(200).json({ status: false, message: "coin planId is required!!" });
    }

    const redeemPlan = await RedeemPlan.findById(req.query.planId);
    if (!redeemPlan) {
      return res.status(200).json({ status: false, message: "plan does not exist!!" });
    }

    redeemPlan.coin = req.body.coin ? req.body.coin : redeemPlan.coin;
    redeemPlan.dollar = req.body.dollar ? req.body.dollar : redeemPlan.dollar;
    redeemPlan.platFormType = req.body.platFormType ? parseInt(req.body.platFormType) : parseInt(redeemPlan.platFormType);
    await redeemPlan.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      redeemPlan,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};

//delete Coin Plan
exports.destroy = async (req, res) => {
  try {
    if (!req.query.planId) {
      return res.status(200).json({ status: false, message: "coin planId is required!!" });
    }

    const redeemPlan = await RedeemPlan.findById(req.query.planId);
    if (!redeemPlan) {
      return res.status(200).json({ status: false, message: "Plan does not exists!!" });
    }

    await redeemPlan.deleteOne();

    return res.status(200).json({ status: true, message: "data deleted successfully!!" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};

//activate Inactivate Switch
exports.activeInactive = async (req, res) => {
  try {
    if (!req.query.planId) {
      return res.status(200).json({ status: false, message: "coin planId is required!!" });
    }

    const redeemPlan = await RedeemPlan.findById(req.query.planId);
    if (!redeemPlan) {
      return res.status(200).json({ status: false, message: "Plan does not exists!!" });
    }

    redeemPlan.isActive = !redeemPlan.isActive;
    await redeemPlan.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      redeemPlan,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//create coinHistory for android
exports.createHistory = async (req, res) => {
  try {
    if (req.body.userId && req.body.redeemPlanId) {
      const [user, redeemPlan] = await Promise.all([User.findById(req.body.userId), RedeemPlan.findById(req.body.redeemPlanId)]);

      if (!user) {
        return res.json({ status: false, message: "User does not exist!!" });
      }

      if (!redeemPlan) {
        return res.json({ status: false, message: "redeemPlanId does not exist!!" });
      }

      user.coin += redeemPlan.coin + redeemPlan.extraCoin;
      user.isRedeemPlan = true;
      user.redeemPlan.planStartDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      user.redeemPlan.redeemPlanId = redeemPlan._id;

      const history = new History();
      history.userId = user._id;
      history.redeemPlanId = redeemPlan._id;
      history.coin = redeemPlan.coin;
      history.type = 2;
      history.paymentGateway = "1";
      history.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      await Promise.all([history.save(), user.save()]);

      return res.json({
        status: true,
        message: "Success",
        history,
      });
    } else {
      return res.json({ status: false, message: "Oops!! Invalid details!!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};
