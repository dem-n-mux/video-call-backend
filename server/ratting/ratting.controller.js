const Ratting = require("./ratting.model");
const User = require("../user/model");
const Host = require("../host/host.model");
const Notification = require("../../server/notification/notification.model");

//mongoose
const mongoose = require("mongoose");

//privat key
const admin = require("../../util/privateKey");

//deleteFile
const { deleteFiles, deleteFile } = require("../../util/deleteFile");

exports.rattingByUserToHost = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.hostId || !req.body.rate) {
      return res.status(200).json({ status: false, message: "Invalid Details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const hostId = new mongoose.Types.ObjectId(req.body.hostId);

    const [user, host] = await Promise.all([User.findById(userId), Host.findById(hostId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User is not Found!" });
    }

    if (!host) {
      return res.status(200).json({ status: false, message: "Host is not Found!" });
    }

    const ratting = new Ratting();
    ratting.userId = user._id;
    ratting.hostId = host._id;
    ratting.rate = req.body.rate;
    await ratting.save();

    res.status(200).json({ status: true, message: "Success", ratting });

    if (host.fcm_token !== null) {
      const adminPromise = await admin;

      const payload = {
        token: host.fcm_token,
        notification: {
          body: "You have received a rating on your profile.",
          title: `${user.name} is rating your profile`,
        },
        data: {
          data: {
            username: user.name,
            image: user.image,
            rate: ratting.rate,
          },
          type: "RATING",
        },
      };

      adminPromise
        .messaging()
        .send(payload)
        .then(async (response) => {
          console.log("Successfully sent with response: ", response);

          const notification = new Notification();
          notification.hostId = host._id;
          notification.userId = user._id;
          notification.type = "host";
          notification.image = user.image;
          notification.title = payload.notification.title;
          notification.message = payload.notification.body;
          notification.notificationType = 5; //5.rating
          notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          await notification.save();
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    deleteFiles(req.files);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};
