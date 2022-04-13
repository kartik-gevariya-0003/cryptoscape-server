const mysql = require("mysql2");

const dbConnection = mysql
  .createConnection({
    host: process.env.DB_HOST || "cryptoscape.chrudlmn8dnf.us-east-1.rds.amazonaws.com",
    user: process.env.DB_USER || "cryptoscape",
    database: process.env.DB_NAME || "cryptoscape",
    password: process.env.DB_PASSWORD || "group123",
  })
  .on("error", (error) => {
    console.log("Database connection failed : ", error);
  });

module.exports = dbConnection;


