const checkHealth = async (request, response, callback) => {
  try {
    return response.status(200).json({
      message: "Crypto-scape server is up and running.",
      version: "1.0.0",
      success: true
    });
  } catch (error) {
    callback(error);
  }
}

module.exports = {checkHealth};
