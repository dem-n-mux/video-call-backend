const config = require("./config");
module.exports = () => {
  return (req, res, next) => {
    const token = req.body.key || req.query.key || req.headers.key;
    if (token) {
      if (token == config.secretKey) {
        next();
      } else {
        // console.log("Unauthorized access");
        return res
          .status(401)
          .send({ success: false, error: "Unauthorized access" });
      }
    } else {
      // console.log("Unauthorized access");
      return res
        .status(401)
        .send({ success: false, error: "Unauthorized access" });
    }
  };
};
