const { verifyToken } = require("../utils/token-utils");

/**
 * This is a middleware function which is responsible for authenticating access token from the request header.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized.",
    });
  }

  req.user = await verifyToken(token);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Token is invalid.",
    });
  } else {
    next();
  }
};

module.exports = { authenticateToken };
