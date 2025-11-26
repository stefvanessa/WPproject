import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Product } from "./models/Product";
import { s3 } from "./config/minIO";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected");

    const productId = "6927314731579d407c41d739";

    // 1. Get the product
    const product = await Product.findById(productId);
    if (!product) return console.log("Product not found");

    // 2. Delete from MinIO
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: product.imageKey
      })
    );
    console.log("Image deleted from MinIO:", product.imageKey);

    // 3. Delete from MongoDB
    await product.deleteOne();
    console.log("Product deleted");

  } catch (err) {
    console.error("DELETE ERROR:", err);
  } finally {
    mongoose.connection.close();
  }
}

run();
