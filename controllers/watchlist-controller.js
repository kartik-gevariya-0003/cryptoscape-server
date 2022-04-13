const {decodeToken} = require("../utils/token-utils");
const dbConnection = require("../database/database-connection");

const getWatchlist = async (request, response, callback) => {
  const authorizationHeader = request.headers.authorization;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails.id) {
    try {
      const getData = [userDetails.id];
      const getQuery = "SELECT * from watchlist where userId = ?";
      dbConnection.query(getQuery, getData, function (error, result) {
        if (error) {
          throw error;
        } else {
          return response.status(200).json({
            watchList: result,
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

const addToWatchList = async (request, response, callback) => {
  const authorizationHeader = request.headers.authorization;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails.id) {
    try {
      const getData = userDetails.id;
      const cryptoId = request.body.cryptoId;
      const addQuery =
        "INSERT into watchlist(cryptoId,userId,watchlistDate) values(?,?,?) on duplicate key UPDATE cryptoId = cryptoId";
      const addQueryData = [
        cryptoId,
        getData,
        new Date().toISOString().slice(0, 19).replace("T", " "),
      ];

      dbConnection.query(addQuery, addQueryData, function (error, result) {
        if (error) {
          throw error;
        } else {
          return response.status(200).json({
            message: "Added successfully!",
            success: "True",
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

module.exports = {getWatchlist, addToWatchList};
