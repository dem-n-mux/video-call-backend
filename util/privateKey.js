const admin = require("firebase-admin");
const initializeSettings = require("../index");

const initFirebase = async () => {
  try {
    await initializeSettings;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(global.settingJSON.privateKey),
      });
      console.log("Firebase Admin SDK initialized successfully");
      return admin;
    } else {
      console.log("Firebase Admin SDK already initialized");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
};

module.exports = initFirebase();
