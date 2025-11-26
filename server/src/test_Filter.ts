import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Product } from "./models/Product";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to DB");

    // Example filters:
    const query = {
      color: "red",
      category: "tops"
    };

    const products = await Product.find(query);
    console.log("Filtered products:", products);

  } catch (err) {
    console.error("FILTER ERROR:", err);
  } finally {
    mongoose.connection.close();
  }
}

run();
