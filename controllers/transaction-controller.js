const dbConnection = require("../database/database-connection");
const { decodeToken } = require("../utils/token-utils");
const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
const queueUrl = process.env.TXN_RECEIPT_GENERATOR_QUEUE || "https://sqs.us-east-1.amazonaws.com/017463699692/transaction-receipt-generator-queue";

const convertCrypto = async (request, response) => {
  const authorizationHeader = request.headers.authorization;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails.id) {
    const postData = request.body;
    if (!postData.sourceCurrency) {
      return response.status(400).json({
        message: "Bad Request: Please provide source currency.",
        success: false,
      });
    }
    if (!postData.destinationCurrency) {
      return response.status(400).json({
        message: "Bad Request: Please provide destination currency.",
        success: false,
      });
    }
    if (!postData.sourceAmount) {
      return response.status(400).json({
        message: "Bad Request: Please provide source quantity.",
        success: false,
      });
    }
    if (!postData.destinationAmount) {
      return response.status(400).json({
        message: "Bad Request: Please provide destination quantity.",
        success: false,
      });
    }
    const buyTransactionData = [
      userDetails.id,
      "SELL",
      postData.sourceCurrency,
      postData.sourcePrice,
      postData.sourceAmount,
    ];
    const buyTransactionInsertQuery =
      "INSERT into transaction (userId, transactionType, cryptoId, transactionAmount, transactionQuantity) values (?, ?, ?, ?, ?)";

    const purchaseTransactionData = [
      userDetails.id,
      "BUY",
      postData.destinationCurrency,
      postData.destinationPrice,
      postData.destinationAmount,
    ];
    const purchaseTransactionInsertQuery =
      "INSERT into transaction (userId, transactionType, cryptoId, transactionAmount, transactionQuantity) values (?, ?, ?, ?, ?)";

    const portfolioForBuyData = [
      postData.sourceAmount,
      postData.sourcePrice,
      postData.sourceCurrency,
      userDetails.id,
    ];
    const portfolioForBuyQuery =
      "UPDATE portfolio set totalQuantity = totalQuantity - ?, totalPrice = totalPrice - ? where cryptoId = ? and userId = ?";

    const portfolioForPurchaseData = [
      userDetails.id,
      postData.destinationCurrency,
      postData.destinationAmount,
      postData.destinationPrice,
    ];
    const portfolioForPurchaseQuery =
      "INSERT INTO portfolio (userId, cryptoId, totalQuantity, totalPrice) values (?, ?, ?, ?) on duplicate key update totalQuantity = totalQuantity + values(totalQuantity), totalPrice = totalPrice + values(totalPrice)";

    dbConnection.query(
      buyTransactionInsertQuery,
      buyTransactionData,
      function (error, sellTransactionResult) {
        if (error) {
          throw error;
        }
        dbConnection.query(
          purchaseTransactionInsertQuery,
          purchaseTransactionData,
          function (error, purchaseTransactionResult) {
            if (error) {
              throw error;
            }
            dbConnection.query(
              portfolioForBuyQuery,
              portfolioForBuyData,
              function (error, result) {
                if (error) {
                  throw error;
                }
                dbConnection.query(
                  portfolioForPurchaseQuery,
                  portfolioForPurchaseData,
                  function (error, result) {
                    if (error) {
                      throw error;
                    }
                    const transactionsIds = [
                      sellTransactionResult.insertId,
                      purchaseTransactionResult.insertId,
                    ];
                    let messageBody = {
                      transactionIds: transactionsIds.join(),
                    };
                    let messageData = {
                      MessageAttributes: {
                        transactionIds: {
                          DataType: "String",
                          StringValue: transactionsIds.join(),
                        },
                      },
                      MessageBody: JSON.stringify(messageBody),
                      QueueUrl: queueUrl,
                    };
                    let sendSqsMessage = sqs.sendMessage(messageData).promise();
                    sendSqsMessage
                      .then((data) => {
                        console.log(`Crypto Sell | SUCCESS: ${data.MessageId}`);
                        return response.status(200).json({
                          message: "Conversion successful",
                        });
                      })
                      .catch((err) => {
                        console.log(`Crypto Sell | ERROR: ${err}`);
                        return response.status(500).json({
                          message: "Internal Server Error",
                        });
                      });
                  }
                );
              }
            );
          }
        );
      }
    );
  } else {
    return response.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }
};

const sellCrypto = async (request, response) => {
  const authorizationHeader = request.headers.authorization;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails && userDetails.id) {
    const postData = request.body;
    if (!postData.cryptoId) {
      return response.status(400).json({
        message: "Bad Request: Please provide the currency to sell.",
        success: false,
      });
    }
    if (!postData.transactionQuantity) {
      return response.status(400).json({
        message: "Bad Request: Please provide quantity of currency to be sold.",
        success: false,
      });
    }
    const buyTransactionData = [
      userDetails.id,
      "SELL",
      postData.cryptoId,
      postData.transactionPrice,
      postData.transactionQuantity,
    ];
    const buyTransactionInsertQuery =
      "INSERT into transaction (userId, transactionType, cryptoId, transactionAmount, transactionQuantity) values (?, ?, ?, ?, ?)";

    const portfolioForBuyData = [
      postData.transactionQuantity,
      postData.transactionPrice,
      postData.cryptoId,
      userDetails.id,
    ];
    const portfolioForBuyQuery =
      "UPDATE portfolio set totalQuantity = totalQuantity - ?, totalPrice = totalPrice - ? where cryptoId = ? and userId = ?";

    dbConnection.query(
      buyTransactionInsertQuery,
      buyTransactionData,
      function (error, sellTransactionResult) {
        if (error) {
          throw error;
        }
        dbConnection.query(
          portfolioForBuyQuery,
          portfolioForBuyData,
          function (error, result) {
            if (error) {
              throw error;
            }
            let messageBody = {
              transactionIds: sellTransactionResult.insertId.toString(),
            };
            let messageData = {
              MessageAttributes: {
                transactionIds: {
                  DataType: "String",
                  StringValue: sellTransactionResult.insertId.toString(),
                },
              },
              MessageBody: JSON.stringify(messageBody),
              QueueUrl: queueUrl,
            };
            let sendSqsMessage = sqs.sendMessage(messageData).promise();
            sendSqsMessage
              .then((data) => {
                console.log(`Crypto Sell | SUCCESS: ${data.MessageId}`);
                return response.status(200).json({
                  message: "Sale successful",
                });
              })
              .catch((err) => {
                console.log(`Crypto Sell | ERROR: ${err}`);
                return response.status(500).json({
                  message: "Internal Server Error",
                });
              });
          }
        );
      }
    );
  } else {
    return response.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }
};

const buyCrypto = async (request, response) => {
  const authorizationHeader = request.headers.authorization;
  let alreadyCrypto = null;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails && userDetails.id) {
    const postData = request.body;
    if (!postData.cryptoId) {
      return response.status(400).json({
        message: "Bad Request: Please provide the currency to buy.",
        success: false,
      });
    }
    if (!postData.transactionQuantity) {
      return response.status(400).json({
        message:
          "Bad Request: Please provide quantity of currency to be bought.",
        success: false,
      });
    }
    let buyTransactionData = [
      userDetails.id,
      "BUY",
      postData.cryptoId,
      postData.transactionPrice,
      postData.transactionQuantity,
    ];
    const buyTransactionInsertQuery =
      "INSERT into transaction (userId, transactionType, cryptoId, transactionAmount, transactionQuantity) values (?, ?, ?, ?, ?)";

    try {
      const getData = [userDetails.id];
      const getQuery =
        "SELECT * from portfolio where userId = ? and cryptoId = ?";
      dbConnection.query(
        getQuery,
        [getData, postData.cryptoId],
        function (error, result) {
          if (error) {
            throw error;
          } else {
            if (result.length) {
              alreadyCrypto = "No";
              buyPortfolioData = [
                postData.transactionQuantity,
                postData.transactionPrice,
                postData.cryptoId,
                userDetails.id,
              ];

              portfolioForBuyQuery =
                "UPDATE portfolio set totalQuantity = totalQuantity + ?, totalPrice = totalPrice + ? where cryptoId = ? and userId = ?";
            } else {
              alreadyCrypto = "Yes";
              buyPortfolioData = [
                postData.cryptoId,
                userDetails.id,
                postData.transactionQuantity,
                postData.transactionPrice,
              ];
              portfolioForBuyQuery =
                "INSERT INTO portfolio (cryptoId, userId, totalQuantity, totalPrice) values (?,?,?,?) ";
            }
            console.log(portfolioForBuyQuery);
            dbConnection.query(
              buyTransactionInsertQuery,
              buyTransactionData,
              function (error, buyTransactionResult) {
                if (error) {
                  throw error;
                }
                dbConnection.query(
                  portfolioForBuyQuery,
                  buyPortfolioData,
                  function (error, result) {
                    if (error) {
                      throw error;
                    }
                    let messageBody = {
                      transactionIds: buyTransactionResult.insertId.toString(),
                    };
                    let messageData = {
                      MessageAttributes: {
                        transactionIds: {
                          DataType: "String",
                          StringValue: buyTransactionResult.insertId.toString(),
                        },
                      },
                      MessageBody: JSON.stringify(messageBody),
                      QueueUrl: queueUrl,
                    };
                    let sendSqsMessage = sqs.sendMessage(messageData).promise();
                    sendSqsMessage
                      .then((data) => {
                        console.log(`Crypto Buy | SUCCESS: ${data.MessageId}`);
                        return response.status(200).json({
                          message: "Buy successful",
                        });
                      })
                      .catch((err) => {
                        console.log(`Crypto Sell | ERROR: ${err}`);
                        return response.status(500).json({
                          message: "Internal Server Error",
                        });
                      });
                  }
                );
              }
            );
          }
        }
      );
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

const getAllTransactions = async (request, response, callback) => {
  const authorizationHeader = request.headers.authorization;
  const userDetails = decodeToken(authorizationHeader);
  if (userDetails.id) {
    try {
      const getData = [userDetails.id];
      const getQuery = "SELECT * from transaction where userId = ? ";
      dbConnection.query(getQuery, getData, function (error, result) {
        if (error) {
          throw error;
        } else {
          return response.status(200).json({
            transactions: result,
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

module.exports = { convertCrypto, sellCrypto, buyCrypto, getAllTransactions };
