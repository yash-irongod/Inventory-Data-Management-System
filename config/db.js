const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory_db";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
};

module.exports = connectDB;
