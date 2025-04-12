const Host = require("../host/host.model");
const User = require("../user/model");
const LiveStreamingHistory = require("../liveStreamingHistory/liveStreamingHistory.model");
const LiveHost = require("./liveHost.model");

//agora-token
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

//privat key
const admin = require("../../util/privateKey");

const LiveHostFunction = async (host, data) => {
  host.name = data.name;
  host.country = data.country;
  host.image = data.image;
  host.album = data.album;
  host.token = data.token;
  host.channel = data.channel;
  host.coin = data.coin;
  host.hostId = data._id;
  host.dob = data.dob;

  await host.save();
  return host;
};

//live host
exports.hostIsLive = async (req, res) => {
  try {
    if (!req.body.hostId) {
      return res.status(200).json({ status: false, message: "hostId must be needed." });
    }

    const host = await Host.findById(req.body.hostId);
    if (!host) {
      return res.status(200).json({ status: false, message: "host does not found!!" });
    }

    if (!global.settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found!!" });
    }

    const liveStreamingHistory = new LiveStreamingHistory();

    //Generate Token
    const role = RtcRole.PUBLISHER;
    const uid = req.body.agoraUID ? req.body.agoraUID : 0;
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = await RtcTokenBuilder.buildTokenWithUid(global.settingJSON.agoraKey, global.settingJSON.agoraCertificate, liveStreamingHistory._id.toString(), uid, role, privilegeExpiredTs);

    host.isOnline = true;
    host.isBusy = true;
    host.isLive = true;
    host.token = token;
    host.channel = liveStreamingHistory._id.toString();
    host.liveStreamingId = liveStreamingHistory._id.toString();
    host.agoraUid = req.body.agoraUID ? req.body.agoraUID : 0;

    liveStreamingHistory.hostId = host._id;
    liveStreamingHistory.startTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    await Promise.all([host.save(), liveStreamingHistory.save(), LiveHost.deleteOne({ hostId: host._id })]);

    let liveHostData;
    const createLiveHost = new LiveHost();
    createLiveHost.liveStreamingId = liveStreamingHistory._id;
    createLiveHost.agoraUID = req.body.agoraUID;

    liveHostData = await LiveHostFunction(createLiveHost, host);

    const liveHost_ = await LiveHost.findById(createLiveHost._id);

    res.status(200).json({
      status: true,
      message: "Success",
      liveHost: liveHost_,
    });

    const user = await User.find({
      isBlock: false,
      isHost: false,
    }).distinct("fcm_token");

    console.log("user  ", user);

    if (user.length !== 0) {
      const adminPromise = await admin;

      const payload = {
        tokens: user,
        notification: {
          title: `${host.name} is live now`,
          body: "click and watch now!!",
          image: host.profileImage || "",
        },
        data: {
          _id: host._id.toString(),
          image: host.image?.toString(),
          profileImage: host?.profileImage?.toString() || "",
          isLive: host.isLive?.toString(),
          token: host.token?.toString(),
          channel: host.channel?.toString(),
          level: host.level?.toString() || "",
          name: host.name?.toString(),
          age: host.age?.toString(),
          callCharge: host.callCharge.toString(),
          isOnline: host.isOnline?.toString(),
          coin: host.coin?.toString(),
          liveStreamingId: liveHostData?.liveStreamingId?.toString(),
          view: liveHostData?.view?.toString(),
          favorite: "false",
          isBusy: host?.isBusy?.toString(),
          type: "LIVE",
        },
      };

      console.log("pay ", payload);

      adminPromise
        .messaging()
        .sendMulticast(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get live host list
exports.getLiveHostList = async (req, res) => {
  try {
    const host = await LiveHost.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          hostId: 1,
          name: 1,
          country: 1,
          image: 1,
          token: 1,
          channel: 1,
          coin: 1,
          dob: 1,
          agoraUID: 1,
          liveStreamingId: 1,
        },
      },
      {
        $addFields: {
          isFake: false,
        },
      },
    ]);

    if (host.length === 0) {
      return res.status(200).json({ status: false, message: "No data found!!" });
    } else {
      return res.status(200).json({
        status: true,
        message: "Success!!",
        host: host,
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
