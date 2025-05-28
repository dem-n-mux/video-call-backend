const express = require("express");
const router = express.Router();

const RatingController = require("./rating.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

router.get("/getRatings/:userId", checkAccessWithSecretKey(), RatingController.getRatings);
router.post("/addRating", checkAccessWithSecretKey(), RatingController.addRating);

module.exports = router;