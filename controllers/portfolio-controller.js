const { decodeToken } = require("../utils/token-utils");
const dbConnection = require("../database/database-connection");

const getUserPortfolio = async (request, response, callback) => {
  const authorizationHeader = request.headers.authorization;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails.id) {
    try {
      const getData = [userDetails.id];
      const getQuery =
        "SELECT * from portfolio where userId = ? and totalQuantity > 0.000";
      dbConnection.query(getQuery, getData, function (error, result) {
        if (error) {
          throw error;
        } else {
          return response.status(200).json({
            portfolio: result,
          });
        }
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Internal Server Error",
        success: false,
      });
    }
  } else {
    return response.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }
};

module.exports = { getUserPortfolio };
