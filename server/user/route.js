const express = require("express");
const router = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

const checkAccessWithSecretKey = require("../../checkAccess");

const userController = require("./controller");

// New APIs

router.post("/login", checkAccessWithSecretKey(), userController.loginUserByPassword);
router.post("/register", checkAccessWithSecretKey(), upload.single("image"), userController.registerUser);
router.get("/checkCode", checkAccessWithSecretKey(), userController.checkCode);

// Existing APIs

router.get("/checkUser", checkAccessWithSecretKey(), userController.checkUser);

router.post("/userProfile", checkAccessWithSecretKey(), upload.single("image"), userController.loginUser);

router.get("/userGet", checkAccessWithSecretKey(), userController.userGet);

router.get("/userProfile", checkAccessWithSecretKey(), userController.userProfile);

router.get("/userProfileByadmin", checkAccessWithSecretKey(), userController.userProfileByadmin);

router.patch("/userProfile", checkAccessWithSecretKey(), upload.single("image"), userController.updateUser);

router.patch("/isBlock", checkAccessWithSecretKey(), userController.isBlock);

router.post("/addLessCoin", checkAccessWithSecretKey(), userController.addOrLessCoin);

router.post("/addCoinByAdmin", checkAccessWithSecretKey(), userController.addCoinByAdmin);

router.get("/adminAddCoinHistory", checkAccessWithSecretKey(), userController.adminAddCoinHistory);

router.delete("/deleteUserAccount", checkAccessWithSecretKey(), userController.deleteUserAccount);

module.exports = router;
