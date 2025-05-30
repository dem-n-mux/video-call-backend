const User = require("./model");

//import model
const Host = require("../host/host.model");
const History = require("../history/history.model");
const Block = require("../block/block.model");
const Chat = require("../chat/chat.model");
const ChatTopic = require("../chatTopic/chatTopic.model");
const Complaint = require("../complaint/complaint.model");
const Notification = require("../notification/notification.model");
const RandomHistory = require("../randomHistory/randomHistory.model");
const Rating = require("../ratting/ratting.model");
const HostRequest = require("../request/request.model");
const ViewStory = require("../viewStory/viewStory.model");

//config
const config = require("../../config");

//fs
const fs = require("fs");

//mongoose
const mongoose = require("mongoose");

//privat key
const admin = require("../../util/privateKey");
const { getAlphaID } = require("../../util/helper");

const userFunction = async (user, data_) => {
  const data = data_.body;
  const file = data_.file;

  user.name = data.name ? data.name : user.name;
  user.email = data.email ? data.email : user.email;
  user.mobileNumber = data.mobileNumber ? data.mobileNumber : user.mobileNumber;
  user.identity = data.identity;
  user.loginType = data.loginType ? data.loginType : user.loginType;
  user.platformType = data.platformType ? data.platformType : user.platformType;
  user.gender = data.gender ? data.gender : user.gender;
  user.image = data.image
    ? data.image
    : !user.image
    ? !file
      ? user.gender === "Female"
        ? `${config.baseURL}storage/female.png`
        : `${config.baseURL}storage/male.png`
      : config.baseURL + file.path
    : user.image;

  user.dob = data.dob ? data.dob : user.dob;
  user.coin = data.coin ? data.coin : user.coin;
  user.fcm_token = data.fcm_token;
  user.age = Number(data.age);
  user.country = data.country ? data.country.toLowerCase().trim() : user.country;
  user.lastLogin = new Date().toLocaleString("en-US");
  user.uniqueID = data.uniqueID ? data.uniqueID : user.uniqueID;

  // var newUsers;

  // if (data.loginType == 1 || data.loginType == 2) {
  //   newUsers = await User.findOne({ email: user.email });
  // }

  // if (!newUsers) {
  //   await user.save();
  // }
  // const users = await User.findById(user._id);
  // return users;

  await user.save();
  return user;
};

//check user plan is expired or not
const checkPlan = async (userId, res) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not exist!!" });
    }

    if (user.plan.planStartDate !== null && user.plan.coinPlanId !== null) {
      const plan = await premiumPlan.findById(user.plan.coinPlanId);

      if (!plan) {
        return res.status(200).json({ status: false, message: "Plan does not exist!!" });
      }

      if (plan.validityType.toLowerCase() === "day") {
        const diffTime = moment(new Date()).diff(moment(new Date(user.plan.planStartDate)), "day");
        if (diffTime > plan.validity) {
          user.isIncome = false;
          user.plan.planStartDate = null;
          user.plan.coinPlanId = null;
        }
      }
      if (plan.validityType.toLowerCase() === "month") {
        const diffTime = moment(new Date()).diff(moment(new Date(user.plan.planStartDate)), "month");
        if (diffTime >= plan.validity) {
          user.isIncome = false;
          user.plan.planStartDate = null;
          user.plan.coinPlanId = null;
        }
      }
      if (plan.validityType.toLowerCase() === "year") {
        const diffTime = moment(new Date()).diff(moment(new Date(user.plan.planStartDate)), "year");
        if (diffTime >= plan.validity) {
          user.isIncome = false;
          user.plan.planStartDate = null;
          user.plan.coinPlanId = null;
        }
      }
    }

    await user.save();

    const user_ = await User.findById(userId);
    return user_;
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error!!!",
    });
  }
};

//check user
exports.checkUser = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "OOps ! email must be requried!" });
    }

    const user = await User.findOne({ email: req.query.email });
    if (user) {
      return res.status(200).json({ status: true, message: "Success", user: user, isProfile: false });
    } else {
      return res.status(200).json({ status: true, message: "Oops ! user does not found!", user: {}, isProfile: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.checkCode = async (req, res) => {
  try {
    if (!req.query.code) {
      return res.status(200).json({ status: false, message: "Code must be present!" });
    }

    const user = await User.findOne({ referralCode: req.query.code });
    if (user) {
      return res.status(200).json({ status: true, message: "Success", user: { name : user.name } });
    } else {
      return res.status(400).json({ status: false, message: "Oops ! user not found!", user: {} });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
}

//login and Create user API [App]
exports.loginUser = async (req, res) => {
  try {
    if (!req.body.identity || req.body.loginType === undefined || !req.body.fcm_token) {
      return res.status(200).json({ status: false, message: "Invalid Details!!" });
    }

    const referredBy = req.body?.referredBy ? req.body.referredBy : null;

    let userQuery;

    if (req.body.loginType == 0) {
      console.log("0");

      if (req.body.identity) {
        userQuery = await User.findOne({ identity: req.body.identity, email: req.body.email }); //email field always be identity
      }
    } else if (req.body.loginType == 1) {
      console.log("1");

      if (!req.body.email) {
        return res.status(200).json({ status: false, message: "Email is required!!" });
      }

      // if (req.body.identity) {
      //   userQuery = await User.findOne({
      //     $or: [{ identity: req.body.identity }, { email: req.body.email }],
      //   });
      // }

      userQuery = await User.findOne({ email: req.body.email });
    }

    const user = userQuery;

    if (user) {
      console.log("user login");

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by admin!" });
      }

      const user_ = await userFunction(user, req);

      return res.status(200).json({
        status: true,
        message: "User login Successfully!!",
        user: user_,
      });
    } else {
      console.log("new user");

      const bonusCoins = settingJSON.loginBonus ? settingJSON.loginBonus : 800;

      const newUser = new User();
      newUser.coin = bonusCoins;

      //unique ID Create
      let LastUser = await User.findOne().sort({ uniqueID: -1 });
      const cnt = parseInt(LastUser?.uniqueID);
      var count;
      if (!cnt) {
        count = 1;
      } else {
        count = cnt + 1;
      }

      var size = count.toString().length;
      newUser.uniqueID =
        size === 1 ? `000000${count}` : size === 2 ? `00000${count}` : size === 3 ? `0000${count}` : size === 4 ? `000${count}` : size === 5 ? `00${count}` : size === 6 ? `0${count}` : count;

      //Password Generate
      const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let password = "";
      for (let i = 0; i < 8; i++) {
        password += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      }
      newUser.password = password;
      newUser.isSignup = true;
      newUser.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      if (referredBy) {
        const referreringUser = await User.findOne({
          referralCode: referredBy,
        });

        if (!referreringUser) { 
          return res.status(400).json({
            message: "Invalid referral code",
          });
        }

        referreringUser.referredUsers.push(newUser._id);
        await referreringUser.save();

        newUser.referredBy = referreringUser._id;
      }

      newUser.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const user = await userFunction(newUser, req);

      res.status(200).json({
        status: true,
        message: "Signup Success And Your Password Send In your Email!!",
        user,
      });

      if (user.fcm_token && user.fcm_token !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcm_token,
          notification: {
            title: "🎁 You've Earned a Welcome Bonus!",
            body: "✨ Thanks for joining us! Enjoy your login bonus as a warm welcome from our team. 🌟",
          },
          data: {
            type: "LOGINBONUS",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error!!",
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    if (!req.body.identity || Number(req.body.loginType) !== 3 || !req.body.fcm_token) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid Details!!" });
    }

    const referredBy = req.body?.referredBy ? req.body.referredBy : null;

    if (referredBy) {
      const refferingUser = await User.findOne({
        referralCode: referredBy,
      });

      if (!refferingUser) {
        return res.status(400).json({
          message: "Invalid referral code",
        });
      }
    }

    const bonusCoins = settingJSON.loginBonus ? settingJSON.loginBonus : 800;
    const newUser = new User();
    newUser.coin = bonusCoins;

    const gender = req.body.gender;
    if (gender !== "Male" && gender !== "Female") {
      return res.status(400).json({ status: false, message: "Invalid gender" });
    }

    const lastUser = await User.find({ gender })
      .sort({ uniqueID: -1 })
      .limit(1);

    let count = 1;
    if (lastUser.length > 0) {
      const lastUID = lastUser[0].uniqueID;

      if (gender === "Female") {
        const alphaPart = lastUID.replace(/^0+/, "");
        let lastAlphaValue = 0;
        for (let i = 0; i < alphaPart.length; i++) {
          lastAlphaValue = lastAlphaValue * 26 + (alphaPart.charCodeAt(i) - 64);
        }
        count = lastAlphaValue + 1;
      } else {
        count = parseInt(lastUID, 10) + 1;
      }
    }

    let uniqueID;

    if (gender === "Female") {
      const alphaID = getAlphaID(count);
      uniqueID = alphaID.padStart(5, "0");
    } else {
      uniqueID = count.toString().padStart(5, "0");
    }

    newUser.uniqueID = uniqueID;
    newUser.password = req.body.password;
    newUser.isSignup = true;
    newUser.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    let referringUser;

    if (referredBy) {
      referringUser = await User.findOne({
        referralCode: referredBy,
      });

      referringUser.referredUsers.push(newUser._id);
      newUser.referredBy = referringUser._id;
      referringUser.coin += settingJSON.referralBonus || 30;
    }

    newUser.referralCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const user = await userFunction(newUser, req);
    if (referringUser) await referringUser.save();

    res.status(200).json({
      status: true,
      message: "Signup Success",
      user,
    });

    if (user.fcm_token && user.fcm_token !== null) {
      const adminPromise = await admin;

      const payload = {
        token: user.fcm_token,
        notification: {
          title: "🎁 You've Earned a Welcome Bonus!",
          body: "✨ Thanks for joining us! Enjoy your login bonus as a warm welcome from our team. 🌟",
        },
        data: {
          type: "LOGINBONUS",
        },
      };

      adminPromise
        .messaging()
        .send(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message: ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error!!",
    });
  }
};

exports.loginUserByPassword = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details!!" });
    }

    const user = await User.findOne({ email: req.body.email });
    const host = await Host.findOne({ email: req.body.email });

    if (!user && !host) {
      return res
        .status(400)
        .json({ status: false, message: "User does not exist!!" });
    }

    const account = user || host;

    if (account.isBlock) {
      return res
        .status(400)
        .json({ status: false, message: "You are blocked by admin!" });
    }

    if (account.password !== req.body.password) {
      return res
        .status(400)
        .json({ status: false, message: "Password is incorrect!!" });
    }

    return res.status(200).json({
      status: true,
      message: "Login Successfully!!",
      ...(!account.isHost ? { user : account } : { host : host }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};

//All User Get API  [Backend]
exports.userGet = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [userCount, userAll] = await Promise.all([
      User.find().countDocuments(),
      User.find()
        .select("name image email gender country coin isBlock createdAt")
        .skip((start - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      status: true,
      message: "finally , get all users by the admin.",
      userCount,
      userAll,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Sever Error" });
  }
};

//Single User Get API [App,Backend]
exports.userProfile = async (req, res) => {
  try {
    const ID = req.query.id;
    const type = req.query.type;

    if (!ID || !type) {
      return res.status(400).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (req.query.type === "User") {
      const findUser = await User.findById(ID);

      if (findUser) {
        return res.status(200).json({
          status: true,
          message: "User Profile Get Successfully",
          findUser,
        });
      } else {
        return res.status(200).json({
          status: false,
          message: "User not found.",
        });
      }
    } else if (req.query.type === "Host") {
      const findUser = await Host.findById(ID);

      if (findUser) {
        return res.status(200).json({
          status: true,
          message: "Host Profile Get Successfully",
          findUser,
        });
      } else {
        return res.status(200).json({
          status: false,
          message: "Host not found.",
        });
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Type must be passed valid.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Sever Error" });
  }
};

//user profile by admin
exports.userProfileByadmin = async (req, res) => {
  try {
    const ID = req.query.id;

    if (!ID) {
      return res.status(400).json({ status: false, message: "Oops ! Invalid details." });
    }

    const findUser = await User.findById(ID);

    if (findUser) {
      return res.status(200).json({
        status: true,
        message: "User Profile Get Successfully",
        findUser,
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Sever Error" });
  }
};

//Update User API [App]
exports.updateUser = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(200).json({ status: false, message: "Invalid Details!" });
    }

    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not Exist!" });
    }

    if (req.file) {
      if (user.image) {
        const image = user.image.split("storage");

        if (image[1] !== "/male.png" && image[1] !== "/female.png") {
          if (image) {
            if (fs.existsSync("storage" + image[1])) {
              fs.unlinkSync("storage" + image[1]);
            }
          }
        }
      }
      user.image = config.baseURL + req.file.path;
    }

    user.name = req.body.name ? req.body.name : user.name;
    user.gender = req.body.gender ? req.body.gender : user.gender;
    user.bio = req.body.bio ? req.body.bio : user.bio;
    user.dob = req.body.dob ? req.body.dob : user.dob;
    user.country = req.body.country ? req.body.country.toLowerCase().trim() : user.country;
    user.age = req.body.age ? parseInt(req.body.age) : user.age;
    await user.save();

    return res.status(200).json({ status: true, message: "Success", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Sever Error" });
  }
};

//user block or unblock
exports.isBlock = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, massage: "UserId is requried!!" });
    }

    const user = await User.findById(req.query.userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!!" });
    }

    user.isBlock = !user.isBlock;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//admin can add or less the Coin or diamond of user through admin panel
exports.addOrLessCoin = async (req, res) => {
  try {
    if (!req.body.userId && !req.body.hostId) {
      return res.status(200).json({ status: false, message: "Invalid details!!" });
    }

    let userQuery;
    if (req.body.userId) {
      userQuery = await User.findById(req.body.userId);
    } else {
      userQuery = await Host.findById(req.body.hostId);
    }

    const user = userQuery;
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!!" });
    }

    if (req.body.coin && parseInt(req.body.coin) === user.coin) {
      return res.status(200).json({
        status: true,
        message: "Success",
        user,
      });
    }

    const history = new History();

    if (req.body.coin) {
      if (user.coin > req.body.coin) {
        //put entry on history in outgoing
        history.isIncome = false;
        history.coin = user.coin - req.body.coin;
      } else {
        //put entry on history in income
        history.isIncome = true;
        history.coin = req.body.coin - user.coin;
      }
      user.coin = req.body.coin;
    }

    if (req.body.userId) {
      history.userId = user._id;
    } else {
      history.hostId = user._id;
    }
    history.type = 8;
    history.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    await Promise.all([history.save(), user.save()]);

    return res.status(200).json({
      status: true,
      message: "Success",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//admin can add or less the Coin or diamond of user through admin panel
exports.addCoinByAdmin = async (req, res) => {
  try {
    if (!req.body.uniqueID || !req.body.coin) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    if (Number(req.body.coin) < 0) {
      return res.status(200).json({ status: false, message: "Coin must be greater than Zero." });
    }

    const user = await User.findOne({ uniqueID: req.body.uniqueID, isHost: false });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    const history = new History();
    history.isIncome = true;
    history.coin = parseInt(req.body.coin);
    history.userId = user;
    history.hostId = null;
    history.type = 8;
    history.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    user.coin = parseInt(user.coin) + parseInt(req.body.coin);

    await Promise.all([history.save(), user.save()]);

    return res.status(200).json({
      status: true,
      message: "Success!!",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get admin addCoin history
exports.adminAddCoinHistory = async (req, res) => {
  try {
    const history = await History.find({ type: 8, hostId: null }).sort({ createdAt: -1 }).populate("userId", "uniqueID");

    return res.status(200).json({
      status: true,
      message: "Success!!",
      history,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//delete user account
exports.deleteUserAccount = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (user?.image) {
      const image = user?.image?.split("storage");
      // if (image) {
      //   if (fs.existsSync("storage" + image[1])) {
      //     fs.unlinkSync("storage" + image[1]);
      //   }
      // }

      const imagePath = "storage" + image[1];
      if (fs.existsSync(imagePath)) {
        const imageName = imagePath.split("/").pop();
        if (imageName !== "male.png" && imageName !== "female.png") {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await Promise.all([
      Block.deleteMany({ userId: user._id }),
      Chat.deleteMany({ senderId: user?._id.toString() }),
      ChatTopic.deleteMany({ userId: user._id }),
      Complaint.deleteMany({ userId: user._id }),
      History.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user?._id }),
      RandomHistory.deleteMany({ userId: user?._id }),
      Rating.deleteMany({ userId: user?._id }),
      HostRequest.deleteMany({ userId: user?._id }),
      ViewStory.deleteMany({ userId: user?._id }),
      User.deleteOne({ _id: user?._id }),
    ]);

    return res.status(200).json({ status: true, message: "User account has been deleted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
