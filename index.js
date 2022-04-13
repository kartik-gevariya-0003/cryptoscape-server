const express = require("express");
const cors = require("cors");
const loginRoutes = require("./routes/user");
const watchlistRoutes = require("./routes/watchlist");
const portfolioRoutes = require("./routes/portfolio");
const transactionRoutes = require("./routes/transaction");
const healthCheckRoute = require("./routes/health-check");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 3001;

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(loginRoutes);
app.use(watchlistRoutes);
app.use(portfolioRoutes);
app.use(transactionRoutes);
// app.use(proxy(transactionRoutes.use, { secure: false }));
app.use(healthCheckRoute);

app.use(function (req, res, next) {
  res.status(404).send({
    message: "Sorry, can not find this resource.",
    success: false,
  });
});

app.use((error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";

  response.status(error.statusCode).json({
    message: error.message,
    success: false,
  });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
