import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Product } from "./models/Product";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected");

    const productId = "6927314731579d407c41d739"; // <-- copy from your DB

    const updated = await Product.findByIdAndUpdate(
      productId,
      { color: "blue", name: "Edited Product Name" },
      { new: true }
    );

    console.log("Updated product:", updated);

  } catch (err) {
    console.error("EDIT ERROR:", err);
  } finally {
    mongoose.connection.close();
  }
}

run();
