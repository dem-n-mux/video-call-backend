const Complaint = require("./complaint.model");
const User = require("../user/model");
const Host = require("../host/host.model");

//fs
const fs = require("fs");

//mongoose
const mongoose = require("mongoose");

//deleteFile
const { deleteFile } = require("../../util/deleteFile");

//config
const config = require("../../config");

//privat key
const admin = require("../../util/privateKey");

//create complaint
exports.store = async (req, res) => {
  try {
    if (!req.body.message || !req.body.contact || !req.file) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    if (req.body.userId) {
      const user = await User.findById(req.body.userId);
      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found!!" });
      }
    }

    if (req.body.HostId) {
      const host = await Host.findById(req.body.HostId);
      if (!host) {
        return res.status(200).json({ status: false, message: "User does not found!!" });
      }
    }

    const complaint = new Complaint();

    complaint.userId = req.body.userId ? req.body.userId : null;
    complaint.hostId = req.body.hostId ? req.body.hostId : null;
    complaint.message = req.body.message;
    complaint.contact = req.body.contact;
    complaint.image = req.file ? config.baseURL + req.file.path : "storage/noImage.png";
    complaint.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    await complaint.save();

    return res.status(200).json({
      status: true,
      message: "Success",
      complaint,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error!!" });
  }
};

//get user or host complaint for admin panel
//exports.userComplaint = async (req, res) => {
//   try {
//     if (!req.query.type)
//       return res
//         .status(200)
//         .json({ status: false, message: "Type is requried!!" });

//     let complaint;
//     if (req.query.type.trim().toLowerCase() === "pending") {
//       complaint = await Complaint.find({
//         isSolved: false,
//       }).populate("userId hostId", "name image coin country");
//     } else if (req.query.type.trim().toLowerCase() === "solved") {
//       complaint = await Complaint.find({
//         isSolved: true,
//       }).populate("userId hostId", "name image coin country");
//     }

//     return res
//       .status(200)
//       .json({ status: true, message: "Success!!", data: complaint });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: false,
//       error: error.message || "Internal Server Error!!",
//     });
//   }
//};

exports.userComplaint = async (req, res) => {
  try {
    if (!req.query.type || !req.query.userType) {
      return res.status(200).json({ status: false, message: "Type is required!!" });
    }

    if (req.query.type.trim().toLowerCase() === "pending") {
      matchQuery = {
        isSolved: false,
      };
    } else if (req.query.type.trim().toLowerCase() === "solved") {
      matchQuery = {
        isSolved: true,
      };
    }

    var lookupQuery, filterQuery;
    if (req.query.userType === "user") {
      filterQuery = { userId: { $ne: null } };
      lookupQuery = {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
      };
    } else if (req.query.userType === "host") {
      filterQuery = { hostId: { $ne: null } };
      lookupQuery = {
        from: "hosts",
        localField: "hostId",
        foreignField: "_id",
        as: "userId",
      };
    }

    const complaint = await Complaint.aggregate([
      { $match: filterQuery },
      {
        $match: matchQuery,
      },
      { $lookup: lookupQuery },
      { $unwind: { path: "$userId", preserveNullAndEmptyArrays: false } },
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({
      status: true,
      message: "Success",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//solve complaint
exports.solveComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.query.complaintId).populate("userId", "name image isBlock fcm_token").populate("hostId", "name image isBlock fcm_token");
    if (!complaint) {
      return res.status(200).json({ status: false, message: "Complaint does not exist!!" });
    }

    complaint.isSolved = !complaint.isSolved;
    await complaint.save();

    res.status(200).json({ status: true, message: "success", data: complaint });

    if (
      (complaint.userId && complaint.userId.isBlock === false && complaint.userId.fcm_token !== null) ||
      (complaint.hostId && complaint.hostId.isBlock === false && complaint.hostId.fcm_token !== null)
    ) {
      const adminPromise = await admin;

      const payload = {
        token: complaint?.userId ? complaint?.userId?.fcm_token : complaint?.hostId?.fcm_token,
        notification: {
          title: complaint?.userId ? `Hello, ${complaint.userId.name}` : `Hello, ${complaint.hostId.name}`,
          body: "Your complaint has been solved.",
        },
      };

      adminPromise
        .messaging()
        .send(payload)
        .then(async (response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get user complaint for android
exports.userComplaintList = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "UserId is required!!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, complaint] = await Promise.all([User.findById(userId), Complaint.find({ userId: userId }).sort({ createdAt: -1 })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not exist!!" });
    }

    return res.status(200).json({ status: true, message: "Success", data: complaint });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get host complain for android
exports.hostComplaintList = async (req, res) => {
  try {
    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "Host id is required!!" });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);

    const [host, complaint] = await Promise.all([Host.findById(hostId), Complaint.find({ hostId: hostId }).sort({ createdAt: -1 })]);

    if (!host) {
      return res.status(200).json({ status: false, message: "Host does not exist!!" });
    }

    return res.status(200).json({ status: true, message: "Success", data: complaint });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};
