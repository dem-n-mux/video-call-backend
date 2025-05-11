const express = require("express");
const route = express.Router();
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

const RedeemPlanController = require("./redeemPlan.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//create coin plan [Backend]
route.post("/", checkAccessWithSecretKey(), RedeemPlanController.store);

//get coin plan [Backend]
route.get("/", checkAccessWithSecretKey(), RedeemPlanController.index);

//get coin plan [APP]
route.get("/appPlan", checkAccessWithSecretKey(), RedeemPlanController.appPlan);

//update coin plan [Backend]
route.patch("/", checkAccessWithSecretKey(), RedeemPlanController.update);

//delete coin plan [Backend]
route.delete("/", checkAccessWithSecretKey(), RedeemPlanController.destroy);

//active deactivate coin plan [Backend]
route.put("/", checkAccessWithSecretKey(), RedeemPlanController.activeInactive);

//create coinHistory for android
route.post(
  "/createHistory",
  checkAccessWithSecretKey(),
  RedeemPlanController.createHistory
);

module.exports = route;
