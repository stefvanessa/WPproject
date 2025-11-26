import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Product } from "./models/Product";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to DB");

    const products = await Product.find();
    console.log("All products:", products);

  } catch (err) {
    console.error("GET ERROR:", err);
  } finally {
    mongoose.connection.close();
  }
}

run();
