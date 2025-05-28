const Rating = require("./rating.model"); 
const Settings = require("../setting/setting.model");

exports.getRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const ratings = await Rating.findOne({ userId }).populate("userId", "name email");

    if (!ratings) {
      return res.status(400).json({ message: "No ratings found for this user" });
    }

    res.status(200).json({ status : true, ratings });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

exports.addRating = async (req, res) => {
  try {
    const { userId, rating } = req.body;

    const setting = await Settings.findOne().sort({ createdAt: -1 });
    const baseCharge = setting.baseCharge;

    if (!userId || !rating) {
      return res.status(400).json({ error: "User ID and rating are required" });
    }

    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

    let existingRating = await Rating.findOne({ userId });

    if (existingRating) {
      const avgRating = Math.round((existingRating.rating + clampedRating) / 2);

      let charges;

      if (avgRating === 1) {
        charges = setting.oneStarCharge || baseCharge;
      }
      else if (avgRating === 2) {
        charges = setting.twoStarCharge || baseCharge;
      }
      else if (avgRating === 3) {
        charges = setting.threeStarCharge || baseCharge;
      }
      else if (avgRating === 4) {
        charges = setting.fourStarCharge || baseCharge;
      }
      else if (avgRating === 5) {
        charges = setting.fiveStarCharge || baseCharge;
      } else {
        charges = baseCharge;
      }

      existingRating.rating = avgRating;
      existingRating.charges = charges;
      await existingRating.save();

      res.status(200).json({ status: true, message: "Rating updated successfully", rating: existingRating });
    } else {
      res.status(400).json({ status: false, message: "Rating not found for this user" });
    }
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
