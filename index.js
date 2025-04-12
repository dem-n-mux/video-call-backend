const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

//logger morgan
var logger = require("morgan");
app.use(logger("dev"));
app.use(cors());
app.use(express.json());

//fs
const fs = require("fs");

//node-cron
const cron = require("node-cron");

//config
const config = require("./config");

//socket io
const http = require("http");
const server = http.createServer(app);
global.io = require("socket.io")(server);

//import model
const Setting = require("./server/setting/setting.model");

//settingJson
const settingJson = require("./setting");

//Declare global variable
global.settingJSON = {};

//handle global.settingJSON when pm2 restart
async function initializeSettings() {
  try {
    const setting = await Setting.findOne().sort({ createdAt: -1 });
    if (setting) {
      console.log("In setting initialize Settings");
      global.settingJSON = setting;
    } else {
      global.settingJSON = settingJson;
    }
  } catch (error) {
    console.error("Failed to initialize settings:", error);
  }
}

module.exports = initializeSettings();

//Declare the function as a global variable to update the setting.js file
global.updateSettingFile = (settingData) => {
  const settingJSON = JSON.stringify(settingData, null, 2);
  fs.writeFileSync("setting.js", `module.exports = ${settingJSON};`, "utf8");

  global.settingJSON = settingData; // Update global variable
  console.log("Settings file updated.", global.settingJSON.privacyPolicyText);
};

//socket.js
require("./socket");

//routes
const Route = require("./route");
app.use("/", Route);

app.use("/storage", express.static(path.join(__dirname, "storage")));
app.use(express.static(path.join(__dirname, "public")));

//public index.html file For React Server
app.get("/*", function (req, res) {
  res.status(200).sendFile(path.join(__dirname, "public", "index.html"));
});

//mongodb connection
mongoose.connect(config?.MONGODB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("MONGO: successfully connected to db");
});

//Server Port
server.listen(config.PORT, () => {
  console.log(`Server Connect Successfully On ${config.PORT}/`);
});
