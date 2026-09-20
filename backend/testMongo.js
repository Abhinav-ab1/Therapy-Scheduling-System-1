import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("✅ MongoDB connection successful!");

  await mongoose.connection.close();

  console.log("✅ MongoDB connection closed!");
} catch (error) {
  console.error("❌ MongoDB connection failed:");
  console.error(error.message);

  process.exit(1);
}