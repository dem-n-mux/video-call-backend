//moment
const moment = require("moment");

//import model
const Host = require("./server/host/host.model");
const ChatTopic = require("./server/chatTopic/chatTopic.model");
const User = require("./server/user/model");
const Chat = require("./server/chat/chat.model");
const LiveStreamingHistory = require("./server/liveStreamingHistory/liveStreamingHistory.model");
const LiveHost = require("./server/liveHost/liveHost.model");
const LiveView = require("./server/liveView/liveView.model");
const History = require("./server/history/history.model");
const Gift = require("./server/gift/gift.model");
const Notification = require("./server/notification/notification.model");
const mongoose = require("mongoose");

//private key
const admin = require("./util/privateKey");

//roundNumber funcyion for coin
const { roundNumber } = require("./util/roundNumber");

io.on("connect", async (socket) => {
  console.log("Socket Connect Successfully!!");

  const { globalRoom } = socket.handshake.query;
  console.log("------globalRoom------", globalRoom);

  //ChatRoom Global Socket
  const { chatRoom } = socket.handshake.query;
  console.log("------chatRoom------", chatRoom);

  //liveRoom and liveHostRoom for live streaming
  let liveRoom; //liveStreamingId
  let liveHostRoom; //hostId

  //this room for getting end time of live streaming
  let liveUserRoom;

  const live = socket.handshake.query.obj
    ? JSON.parse(socket.handshake.query.obj) //data becomes a JavaScript object
    : null;

  console.log("live object in connect------", socket.handshake.query.obj);
  console.log("live-----", live);

  if (live !== null) {
    liveRoom = live.liveRoom;
    liveHostRoom = live.liveHostRoom;
    liveUserRoom = live.liveUserRoom;
  }

  console.log("------liveRoom------", liveRoom);
  console.log("------liveHostRoom------", liveHostRoom);
  console.log("------liveUserRoom------", liveUserRoom);

  //callIdRoom for handle callId listen in caller phone
  const { callIdRoom } = socket.handshake.query;

  //callRoom, globalRoom and videoCallRoom for one to one call
  const { callRoom } = socket.handshake.query; //historyId

  console.log("callRoom------------", callRoom);

  //object for make busy

  const { videoCallRoom } = socket.handshake.query; //historyId

  console.log("videoCallRoom------------", videoCallRoom);

  //socket join into room
  socket.join(globalRoom);
  socket.join(chatRoom);
  socket.join(liveRoom);
  socket.join(liveHostRoom);
  socket.join(videoCallRoom);
  socket.join(callRoom);
  socket.join(callIdRoom);

  console.log("liveRoom ==============", liveRoom);

  if (globalRoom) {
    console.log("check In globalroom==================>", globalRoom);

    const host = await Host.findById(globalRoom);

    if (host) {
      console.log("$$$$$$$$$$$$$$$$$$$$ HOst", host.isOnline);
      host.isOnline = true;
      await host.save();
    } else {
      const user = await User.findById(globalRoom);
      console.log("$$$$$$$$$$$$$$$$$$$$ User", user.isOnline);
      if (user) {
        user.isOnline = true;
        await user.save();
      }
    }

    //console.log("Host ==================>", host);
  }

  //videoCallRoom
  if (videoCallRoom) {
    const history = await History.findById(videoCallRoom);

    if (history) {
      const user = await User.findById(history.userId);
      const host = await Host.findById(history.hostId);

      if (user) {
        user.isBusy = true;
        await user.save();
        console.log("user is busy when socket connect --------", user.isBusy);
      }

      if (host) {
        host.isBusy = true;
        await host.save();
        console.log("host is busy when socket connect ------", host.isBusy);
      }
    }
  }

  //Chat Socket event
  socket.on("chat", async (data) => {
    console.log("data in chat socket", data);

    if (data.messageType == 3) {
      const chatTopic = await ChatTopic.findById(data.topicId).populate("hostId userId");

      let receiverId, senderId, type;

      if (chatTopic.userId._id.toString() === data.senderId.toString()) {
        senderId = chatTopic.userId;
        receiverId = chatTopic.hostId;
        type = "user";
      } else if (chatTopic.hostId._id.toString() === data.senderId.toString()) {
        senderId = chatTopic.hostId;
        receiverId = chatTopic.userId;
        type = "host";
      }

      console.log("rece", receiverId);

      if (chatTopic) {
        const chat = new Chat();

        chat.senderId = data.senderId;
        chat.messageType = 3;
        chat.message = data.message;
        chat.image = null;
        chat.audio = null;
        chat.video = null;
        chat.type = data.type;
        chat.topicId = chatTopic._id;
        chat.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        chatTopic.chat = chat._id;

        await Promise.all([chat.save(), chatTopic.save()]);

        console.log("--------2.emit chat event------");

        io.in(chatRoom).emit("chat", chat);

        //notification related
        if (receiverId && !receiverId.isBlock && receiverId.fcm_token !== null) {
          const adminPromise = await admin;

          const payload = {
            token: receiverId.fcm_token,
            notification: {
              body: chat.message,
              title: senderId.name,
            },
            data:
              type === "user"
                ? {
                    topic: chatTopic._id.toString(),
                    message: chat.message,
                    date: chat.date,
                    chatDate: chat.date,
                    _id: senderId._id.toString(),
                    name: senderId.name?.toString() || "",
                    username: senderId.username?.toString() || "",
                    image: senderId.image,
                    country: senderId.country,
                    time: "Just Now",
                    type: "MESSAGE",
                  }
                : {
                    topic: chatTopic._id.toString(),
                    message: chat.message,
                    date: chat.date,
                    chatDate: chat.date,
                    _id: senderId._id.toString(),
                    name: senderId.name.toString() || "",
                    image: senderId.image,
                    country: senderId.country,
                    time: "Just Now",
                    type: "MESSAGE",
                  },
          };

          console.log("pay ", payload);

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
      }
    } else {
      console.log("------3.emit chat event------");

      io.in(chatRoom).emit("chat", data);

      const chatTopic = await ChatTopic.findById(data.topicId).populate("hostId userId");

      let receiverId, senderId;

      if (chatTopic.userId._id.toString() === data.senderId.toString()) {
        senderId = chatTopic.userId;
        receiverId = chatTopic.hostId;
        type = "user";
      } else if (chatTopic.hostId._id.toString() === data.senderId.toString()) {
        senderId = chatTopic.hostId;
        receiverId = chatTopic.userId;
        type = "host";
      }

      //notification related
      if (receiverId && !receiverId.isBlock && receiverId.fcm_token !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverId.fcm_token,
          notification: {
            body: data.messageType === 0 ? "📸 Image" : data.messageType === 1 ? "🎥 Video" : data.messageType === 2 ? "🎤 Audio" : "New message",
            title: senderId.name ? `Message from ${senderId?.name}` : "New Message",
          },
          data:
            type === "user"
              ? {
                  topic: chatTopic._id.toString(),
                  message: "New Message",
                  _id: senderId._id.toString(),
                  name: senderId.name?.toString() || "",
                  username: senderId.username?.toString() || "",
                  image: senderId.image,
                  country: senderId.country,
                  time: "Just Now",
                  type: "MESSAGE",
                }
              : {
                  topic: chatTopic._id.toString(),
                  message: "New Message",
                  _id: senderId._id.toString(),
                  name: senderId.name.toString() || "",
                  image: senderId.image,
                  country: senderId.country,
                  time: "Just Now",
                  type: "MESSAGE",
                },
        };

        console.log("pay ", payload);

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
    }
  });

  socket.on("readMessage", async (data) => {
    const chat = await Chat.findById(data.chatId);
    console.log("-----chatId------", chat);

    if (chat) {
      chat.isRead = true;
      await chat.save();
    }
  });

  socket.on("status", async (data) => {
    console.log("status data-------", data);

    var query;
    if (data.type === 1) {
      query = await User.findById(data.userId);
    } else if (data.type === 0) {
      query = await Host.findById(data.userId);
    }

    const user = query;
    if (!user) return io.in(chatRoom).emit("status", "User not found!!");

    io.in(chatRoom).emit("status", {
      status: user ? (user.isOnline ? "Online" : moment(new Date(user.lastSeen)).fromNow()) : "",
    });
  });

  //live streaming socket event
  socket.on("liveStreaming", async (data) => {
    console.log("liveStreaming", data);
    console.log("liveRoom liveStreaming ", liveRoom);

    io.in(liveRoom).emit("liveStreaming", data);
  });

  //live streaming in stickers socket event
  socket.on("sticker", async (data) => {
    console.log("sticker", data);
    io.in(liveRoom).emit("sticker", data);
  });

  socket.on("fire", async (data) => {
    console.log("fire", data);
    io.in(liveRoom).emit("fire", data);
  });

  socket.on("effect", async (data) => {
    console.log("effect", data);
    io.in(liveRoom).emit("effect", data);
  });

  //add View Socket event
  socket.on("addView", async (data) => {
    console.log("data in add view ", data);
    console.log("liveRoom in add view ", liveRoom);

    const liveHost = await LiveHost.findOne({ liveStreamingId: liveRoom });
    if (liveHost) {
      liveHost.view += 1;
      await liveHost.save();
    }

    const liveView = new LiveView();
    liveView.userId = data.userId;
    liveView.name = data.name;
    liveView.image = data.image;
    liveView.liveStreamingId = data.liveStreamingId;
    await liveView.save();

    const liveView_ = await LiveView.aggregate([
      {
        $match: {
          liveStreamingId: mongoose.Types.ObjectId(liveRoom),
        },
      },
    ]);

    console.log("liveView in add view", liveView_.length);

    if (liveView_.length === 0) return io.in(liveRoom).emit("view", []);

    io.in(liveRoom).emit("view", liveView_);
  });

  //less View Socket event
  socket.on("lessView", async (data) => {
    console.log("data in lessView ", data);
    console.log("liveRoom in lessView ", liveRoom);

    const liveView = await LiveView.findOne({
      $and: [{ userId: data.userId }, { liveStreamingId: liveRoom }],
    });

    if (liveView) {
      await liveView.deleteOne();
    }

    const liveHost = await LiveHost.findOne({ liveStreamingId: liveRoom });
    if (liveHost) {
      liveHost.view -= 1;
      await liveHost.save();
    }

    const view_ = await LiveView.find({ liveStreamingId: liveRoom });

    console.log("view in lessView", view_.length);

    if (view_.length === 0) return io.in(liveRoom).emit("view", []);

    io.in(liveRoom).emit("view", view_);
  });

  //comment during live event
  socket.on("comment", async (data) => {
    console.log("comment", data);
    console.log("LiveRoom comment ", liveRoom);

    //const sockets = await io.in(liveRoom).fetchSockets();
    //console.log("sockets in liveRoom =====================", sockets.length);

    const xyz = io.sockets.adapter.rooms.get(liveRoom);
    console.log("sockets ====================================: ", xyz);

    const liveStreamingHistory = await LiveStreamingHistory.findById(data.liveStreamingId);
    if (liveStreamingHistory) {
      liveStreamingHistory.comment += 1;
      await liveStreamingHistory.save();
    }

    io.in(liveRoom).emit("comment", data);
  });

  //get userProfile event in live
  socket.on("getUserProfile", async (data) => {
    console.log("data in getUserProfile", data);

    const user = await User.findById(data.userId);
    if (!user) {
      const host = await Host.findById(data.userId);

      return io.in(liveRoom).emit("getUserProfile", null, host);
    }

    io.in(liveRoom).emit("getUserProfile", user, null);
  });

  //get live blockList event
  socket.on("blockList", (data) => {
    console.log("block data", data);
    console.log("block liveRoom", liveRoom);
    io.in(liveRoom).emit("blockList", data);
  });

  socket.on("UserGift", async (data) => {
    console.log("calroom ============", callRoom);
    console.log("data in gift--------", data);

    const coin = Math.abs(data.coin);
    const giftData = data.gift; //giftId
    console.log("data in giftData--------", giftData);

    const charges = parseInt(global.settingJSON.coinCharge) / 100;

    const [senderUser, receiverHost, gift, number] = await Promise.all([
      User.findById(data.senderUserId),
      Host.findById(data.receiverHostId),
      Gift.findById(giftData._id),
      roundNumber(coin * charges),
    ]);

    if (senderUser && receiverHost) {
      console.log("receiver host or user coin before gift-----", receiverHost.coin);

      senderUser.coin -= coin;
      await senderUser.save();

      if (receiverHost.isHost) {
        console.log("isHost-------", data.isHost);
        console.log("number------", number);

        receiverHost.coin += number;
        receiverHost.receiveCoin += number;
        receiverHost.receiveGift += 1;
        await receiverHost.save();
      }

      console.log("2. emit gift event in liveRoom ---------", data);
      console.log("3. emit gift event in liveRoom ---------", senderUser);
      console.log("4. emit gift event in liveRoom ---------", receiverHost);

      if (!data.video) {
        io.in(liveRoom).emit("gift", data, senderUser, receiverHost);
      } else {
        io.in(videoCallRoom).emit("gift", data, senderUser, receiverHost);
      }

      if (!data.video) {
        const liveHost = await LiveHost.findOne({
          hostId: receiverHost._id,
        });

        liveHost.coin += number;
        await liveHost.save();
      }

      //outgoing history
      const outgoing = new History();

      outgoing.userId = senderUser._id;
      outgoing.coin = coin;
      outgoing.type = 0;
      outgoing.isIncome = false;
      outgoing.hostId = receiverHost._id;
      outgoing.giftId = gift._id;
      outgoing.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      await outgoing.save();

      console.log("receiver host or after coin before gift-----", receiverHost.coin);

      //income history
      if (receiverHost.isHost) {
        //income history
        const income = new History();

        income.hostId = receiverHost._id;
        income.coin = number;
        income.type = 0;
        income.isIncome = true;
        income.userId = senderUser._id;
        income.giftId = gift._id;
        income.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        await income.save();
      }

      if (data.liveStreamingId) {
        const liveStreamingHistory = await LiveStreamingHistory.findById(data.liveStreamingId);

        if (liveStreamingHistory) {
          liveStreamingHistory.coin += coin;
          liveStreamingHistory.gift += 1;
          liveStreamingHistory.endTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

          await liveStreamingHistory.save();
        }
      }
    }
  });

  //videoCall socket event
  socket.on("callRequest", async (data) => {
    console.log("data in callRequest---------", data);

    if (data.live) {
      const liveHost = await LiveHost.findOne({ liveStreamingId: liveRoom });
      if (liveHost) {
        io.in(liveRoom).emit("liveStreaming", liveHost);
      }
    }

    io.in(data.receiverId).emit("callRequest", data);
  });

  socket.on("callConfirmed", async (data) => {
    console.log("callConfirm data -------------------", data);
    console.log("callRoom in callConfirm data -------------------", callRoom);

    if (callRoom) {
      console.log("----------- callConfirm emitted --------------", callRoom);

      io.in(callRoom).emit("callConfirmed", data);

      var userQuery, hostQuery;

      if (data.videoCallType === "user") {
        userQuery = await User.findById(data.callerId);
        hostQuery = await Host.findById(data.receiverId);
      } else {
        userQuery = await User.findById(data.receiverId);
        hostQuery = await Host.findById(data.callerId);
      }

      const user = userQuery;
      const host = hostQuery;

      console.log("hooooooost ===>", hostQuery);
      console.log("usessssssr ===>", userQuery);

      const chatTopic = await ChatTopic.findOne({
        userId: user._id,
        hostId: host._id,
      });

      const chat = new Chat();

      if (chatTopic) {
        chatTopic.chat = chat._id;
        chatTopic.userId = user._id;
        chatTopic.hostId = host._id;
        await chatTopic.save();

        chat.topicId = chatTopic._id;
      } else {
        const newChatTopic = new ChatTopic();
        newChatTopic.chat = chat._id;
        newChatTopic.userId = user._id;
        newChatTopic.hostId = host._id;
        await newChatTopic.save();

        chat.topicId = newChatTopic._id;
      }

      chat.senderId = data.callerId;
      chat.messageType = 5;
      chat.message = "📽 Video Call";
      chat.callId = callRoom;
      chat.audio = null;
      chat.video = null;
      chat.type = data.type;
      chat.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      await chat.save();

      console.log("chat-----------------", chat);

      if (host) {
        host.isBusy = true;
        await host.save();
        console.log("host busy in call Confirm ------", host.isBusy);
      }

      if (user) {
        user.isBusy = true;
        await user.save();
        console.log("user busy in call Confirm ------", user.isBusy);
      }

      console.log("callRoom in call Confirm ---------", callRoom);
    }
  });

  socket.on("callAnswer", async (data) => {
    console.log("data in call answer---------", data);
    console.log("############### data.accept ------", data.accept);

    const [callDetail, chat] = await Promise.all([
      History.findById(callRoom),
      Chat.findOne({ callId: callRoom }), //historyId
    ]);

    if (!data.accept) {
      const host = await Host.findById(callDetail?.hostId);
      if (host) {
        host.isBusy = false;
        host.isConnect = false;
        await host.save();

        console.log("############### host busy in call Answer ------", host.isBusy);
      }

      const user = await User.findById(callDetail?.userId);
      if (user) {
        user.isBusy = false;
        await user.save();

        console.log("############### user busy in call Answer -----", user.isBusy);
      }

      if (chat) {
        chat.callType = 2; // 2. decline
        chat.isRead = true;
        chat.messageType = 5;
        await chat.save();
      }
    }

    if (data.live && !data.accept) {
      const liveHost = await LiveHost.findOne({ liveStreamingId: liveRoom });
      if (liveHost) {
        liveHost.isInCall = false;
        await liveHost.save();

        io.in(liveRoom).emit("liveStreaming", liveHost);
      }

      if (chat) {
        chat.callType = 2; // 2. decline
        chat.isRead = true;
        chat.messageType = 5;
        await chat.save();
      }
    }

    if (callRoom) {
      io.in(callRoom).emit("callAnswer", data);
    }
  });

  socket.on("callReceive", async (data) => {
    console.log("--------------------callReceive data----------", data);
    console.log("--------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ Video Call Room $$$$$$$$$$$$$$$$$$$$$$$$----------", videoCallRoom);

    const charges = parseInt(global.settingJSON.coinCharge) / 100;
    console.log("charges ==========", charges);

    const callDetail = await History.findById(data.callId);
    console.log("callDetail----", callDetail);

    if (callDetail) {
      const [number, user, host] = await Promise.all([roundNumber(data.coin * charges), User.findById(callDetail.userId), Host.findById(callDetail.hostId)]);

      console.log("number ==========", number);
      console.log("host busy in call Receive ------", host.isBusy);
      console.log("user busy in call Receive ------", user.isBusy);
      console.log("user.coin ==========================", user.coin);

      if (user && user.coin >= data.coin) {
        if (!data.live) {
          if (user.remainFreeCall > 0) user.remainFreeCall -= 1;
        }

        await History.updateMany(
          { callUniqueId: data.callId, callConnect: false },
          {
            $set: {
              callConnect: true,
              callStartTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            },
          },
          {
            $new: true,
          }
        );

        if (data.callType === "random") {
          console.log("chargeForRandomCall type random call ", global.settingJSON.chargeForRandomCall);

          // const history = new History();
          // history.userId = user._id;
          // history.type = 9; //random
          // history.isIncome = false;
          // history.coin = global.settingJSON.chargeForRandomCall;
          // history.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          // history.hostId = host._id;
          // await history.save();

          await History.updateOne(
            { callUniqueId: data.callId, isIncome: false },
            {
              $inc: { coin: global.settingJSON.chargeForRandomCall },
            },
            {
              $new: true,
            }
          );

          await History.updateOne(
            { callUniqueId: data.callId, isIncome: true },
            {
              $inc: { coin: number },
            },
            {
              $new: true,
            }
          );

          user.coin -= global.settingJSON.chargeForRandomCall;
          await user.save();
        } else if (data.callType === "private") {
          console.log("type private call ");

          await History.updateOne(
            { callUniqueId: data.callId, isIncome: false },
            {
              $inc: { coin: data.coin },
            },
            {
              $new: true,
            }
          );

          await History.updateOne(
            { callUniqueId: data.callId, isIncome: true },
            {
              $inc: { coin: number },
            },
            {
              $new: true,
            }
          );

          user.coin -= data.coin;
          await user.save();
        }

        if (data.callType === "private") {
          host.coin += number;
          host.receiveCoin += number;
          host.isLive = false;

          await host.save();
        } else if (data.callType === "random") {
          host.coin += number;
          host.receiveCoin += number;
          host.isLive = false;

          await host.save();
        }

        io.in(callRoom).emit("callReceive", user, host);

        const chat = await Chat.findOne({ callId: callRoom });
        if (chat) {
          chat.callType = 1; //1. receive , 2. decline , 3. missCall
          chat.isRead = true;
          await chat.save();
        }
      } else {
        console.log("you don't have sufficient coin.");

        io.in(callRoom).emit("callReceive", "you don't have sufficient coin.");
      }
    } else {
      console.log("CallId not found.");

      io.in(callRoom).emit("callReceive", "Something went wrong!.");
    }
  });

  socket.on("callCancel", async (data) => {
    console.log("data in callCancel-----------", data);
    console.log("callRoom in callCancel-----------", callRoom);

    if (callRoom) {
      console.log("callCancel emit thyu ---------------");
      io.in(callRoom).emit("callCancel", data);

      if (data.live) {
        const liveHost = await LiveHost.findOne({ liveStreamingId: liveRoom });

        if (liveHost) {
          liveHost.isInCall = false;
          await liveHost.save();

          io.in(liveRoom).emit("liveStreaming", liveHost);
          io.in(liveHostRoom).emit("callCancel", data);
        }
      }

      const history = await History.findById(callRoom);

      if (history) {
        const host = await Host.findById(history.hostId);

        if (host) {
          if (host && !data.live) {
            host.isBusy = false;
          }
          host.isConnect = false;
          await host.save();

          console.log("host busy in call Cancel ------", host.isBusy);
        }

        const user = await User.findById(history.userId);

        if (user) {
          user.isBusy = false;
          await user.save();

          console.log("user busy in call Cancel ------", user.isBusy);
        }
      }

      const chat = await Chat.findOne({ callId: callRoom });
      console.log("callRoom--------------", callRoom);
      console.log("chat$$$$$$$$$$$$$---------------", chat);

      if (chat) {
        chat.callType = 3; //3.missCall
        chat.isRead = true;
        chat.messageType = 5;
        await chat.save();

        console.log("call cancel type ----------", data.type);

        if (data.type === "user") {
          console.log("notification mate aavyu---------------------");

          const receiver = await Host.findById(data.receiverId);
          const sender = await User.findById(data.callerId);

          if (receiver.fcm_token !== null) {
            const adminPromise = await admin;

            const payload = {
              token: receiver.fcm_token,
              notification: {
                body: "You missed a call.",
                title: sender.name,
              },
              data: {
                type: "MISCALL",
              },
            };

            adminPromise
              .messaging()
              .send(payload)
              .then(async (response) => {
                console.log("Successfully sent with response: ", response);

                const notification = new Notification();
                notification.hostId = receiver._id;
                notification.userId = sender._id;
                notification.type = "user";
                notification.image = sender.image;
                notification.title = payload.notification.title;
                notification.message = payload.notification.body;
                notification.notificationType = 1; //1.call
                notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
                await notification.save();
              })
              .catch((error) => {
                console.log("Error sending message:      ", error);
              });
          }
        }
      }
    }
  });

  socket.on("callDisconnect", async (data) => {
    console.log("callDisconnect------------------", data);
    console.log("VideoCall Room------------------", videoCallRoom);

    await History.updateMany(
      { callUniqueId: mongoose.Types.ObjectId(data.callId) },
      {
        $set: {
          callEndTime: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
          }),
        },
      }
    );

    if (liveRoom) {
      const liveHost = await LiveHost.findOne({ liveStreamingId: liveRoom });

      if (liveHost) {
        liveHost.isInCall = false;
        await liveHost.save();

        io.in(liveRoom).emit("liveStreaming", liveHost);
      }
    }

    const callHistory = await History.find({ callUniqueId: data.callId });

    console.log("data.callId*----", data.callId);
    console.log("callHistory*----", callHistory);

    if (callHistory.length > 0) {
      const host = await Host.findById(callHistory[0].hostId);

      if (host) {
        host.isBusy = false;
        host.isConnect = false;
        await host.save();

        console.log("host busy in callDisconnect---------", host.isBusy);
      }

      const user = await User.findById(callHistory[0].userId);

      if (user) {
        user.isBusy = false;
        await user.save();

        console.log("user busy in callDisconnect---------", user.isBusy);
      }
    }

    const history = await History.findById(callRoom);
    const chat = await Chat.findOne({ callId: callRoom }); //historyId

    if (chat) {
      chat.callDuration = moment.utc(moment(new Date(history?.callEndTime)).diff(moment(new Date(history?.callStartTime)))).format("HH:mm:ss");
      chat.callType = 1; // 1. receive
      chat.isRead = true;
      chat.messageType = 5;
      await chat.save();
    }
  });

  socket.on("randomCancel", async (data) => {
    console.log("randomCancel-----------------------", data);

    var hostQuery, userQuery;

    if (data.senderType === "user" && data.receiverType === "host") {
      userQuery = await User.findById(data.senderId);
      hostQuery = await Host.findById(data.receiverId);
    } else if (data.senderType === "host") {
      userQuery = await User.findById(data.receiverId);
      hostQuery = await Host.findById(data.senderId);
    }

    const host = hostQuery;
    const user = userQuery;

    if (!data.isListen) {
      console.log("data.isListen----------", data.isListen);

      if (data.receiverId !== "") {
        console.log("data.receiverId in data.isListen------", data.receiverId);

        if (host) {
          host.isBusy = false;
          host.isConnect = false;
          await host.save();

          console.log("1...host busy in randomCall cancel -----", host.isBusy);
        }

        if (user) {
          user.isBusy = false;
          await user.save();

          console.log("1...user busy in randomCall cancel -----", user.isBusy);
        }

        // if (otherUser) {
        //   otherUser.isBusy = false;
        //   await otherUser.save();

        //   console.log(
        //     "1...otherUser busy in randomCall cancel -----",
        //     otherUser.isBusy
        //   );
        // }
      }

      return;
    }

    console.log("Host in randomCall cancel---------------", host);

    if (host) {
      host.isBusy = false;
      host.isConnect = false;
      await host.save();

      console.log("2...host busy in randomcall cancel----", host.isBusy);
    }

    if (user) {
      user.isBusy = false;
      await user.save();

      console.log("2...user busy in randomCall cancel----", user.isBusy);
    }

    io.in(data.receiverId).emit("randomCancel", data);
  });

  // ======================== Socket Disconnect ====================

  socket.on("disconnect", async () => {
    if (globalRoom) {
      const host = await Host.findById(globalRoom);

      console.log("++++ globalRoom +++", globalRoom);
      if (host) {
        host.isOnline = false;
        await host.save();
      } else {
        const user = await User.findById(globalRoom);
        if (user) {
          user.isOnline = false;
          await user.save();
        }
      }
    }

    //live streaming socket disconnect
    console.log("disconnect User LiveRoom", liveRoom);
    console.log("disconnect User LiveHostRoom", liveHostRoom);

    const liveStreamingHistory = await LiveStreamingHistory.findById(liveRoom);
    console.log("liveStreamingHistory--------", liveStreamingHistory);

    if (liveStreamingHistory) {
      liveStreamingHistory.endTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      liveStreamingHistory.duration = moment.utc(moment(new Date(liveStreamingHistory.endTime)).diff(moment(new Date(liveStreamingHistory.startTime)))) / 1000;

      await liveStreamingHistory.save();
    }
    console.log("$$$$$$$$$$$$$$$$$$$$$ liveHostRoom Disconnect ======================", liveHostRoom);
    if (liveHostRoom) {
      const liveHost = await LiveHost.findOne({ hostId: liveHostRoom });
      console.log("liveHost------", liveHost);

      const host = await Host.findById(liveHostRoom);
      console.log("host------", host);

      host.isLive = false;
      host.isBusy = false;

      await host.save();

      console.log("$$$$$$$$$$$$$$$$$$$$$ Live Disconnect ======================", host);

      if (liveHost) {
        await LiveView.deleteMany({
          liveStreamingId: liveHost.liveStreamingId,
        });

        await liveHost.deleteOne();
      }
    }

    if ((videoCallRoom && !callRoom) || (callRoom && !videoCallRoom)) {
      console.log("callRoom in socket disconnect -------", callRoom);
      console.log("videoCallRoom in socket disconnect ------", videoCallRoom);

      var query;

      if (callRoom) {
        query = callRoom;
      } else if (videoCallRoom) {
        query = videoCallRoom;
      }

      if (query) {
        const history = await History.findById(query);

        const host = await Host.findById(videoCallRoom);

        if (host) {
          host.isBusy = false;
          host.isConnect = false;
          await host.save();

          console.log("host busy in socket disconnect -------", host.isBusy);
        }

        const user = await User.findById(videoCallRoom);

        if (user) {
          user.isBusy = false;
          await user.save();

          console.log("user busy in socket disconnect -------", user.isBusy);
        }

        if (history) {
          history.duration = moment.utc(moment(new Date(history.callEndTime)).diff(moment(new Date(history.callStartTime)))) / 1000;

          await history.save();
        }

        if (callRoom) {
          const history = await History.findById(callRoom);
          const chat = await Chat.findOne({ callId: callRoom }); //historyId

          if (chat) {
            chat.callDuration = moment.utc(moment(new Date(history?.callEndTime)).diff(moment(new Date(history?.callStartTime)))).format("HH:mm:ss");
            chat.callType = 1; // 1. receive
            chat.isRead = true;
            chat.messageType = 5;
            await chat.save();
          }
        }

        const hostHistory = await History.findOne({
          $and: [
            { _id: { $ne: callRoom } },
            { callUniqueId: callRoom }, //historyId
          ],
        });

        if (hostHistory) {
          hostHistory.duration = moment.utc(moment(new Date(history.callEndTime)).diff(moment(new Date(history.callStartTime)))) / 1000;

          await hostHistory.save();
        }
      }
    }
  });
});
