const express = require("express");
const productRoutes = require("./routes/productRoutes");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(requestLogger);
app.get("/", (req, res) => {
  res.status(200).json({ message: "Inventory API is running" });
});
app.use("/api/products", productRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
