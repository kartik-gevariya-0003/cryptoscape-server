const jwt = require("jsonwebtoken");

const verifyToken = async (token) => {
  if (token) {
    try {
      return await jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (error) {
      return null;
    }
  }
  return null;
}

const decodeToken = (authorizationHeader) => {
  if (authorizationHeader) {
    try {
      let token = authorizationHeader.split(" ").pop() || '';
      return jwt.decode(token);
    } catch (error) {
      return null
    }
  }
  return null
}

const generateToken = async (userDetails) => {
  console.log(process.env.TOKEN_SECRET);
  return jwt.sign(userDetails, process.env.TOKEN_SECRET, {expiresIn: '86400s'});
}

module.exports = {verifyToken, decodeToken, generateToken}