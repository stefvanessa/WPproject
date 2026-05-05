import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { s3 } from "./config/minIO";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { Product } from "./models/Product";
import fs from "fs";

async function run() {
  try {
    // 1. CONNECT DB
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");

    // 2. SIMULATE IMAGE UPLOAD
    const filePath = "C:/Users/stefv/OneDrive/Pictures/certificat C1.png";
    const buffer = fs.readFileSync(filePath);
    const fileName = `${uuid()}-test.png`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: "image/png",
      })
    );

    console.log("Uploaded to MinIO:", fileName);

    // 3. CREATE PRODUCT IN DB
    const product = await Product.create({
      name: "Test Product",
      category: "tops",
      type: "tshirt",
      color: "red",
      pattern: "graphic",
      fit: "regular",
      style: ["casual"],
      temperature: ["cold"],
      imageKey: fileName,
      user: "676a0f34d123456789abcdef" // any fake ObjectId
    });

    console.log("Product created:", product);

  } catch (err) {
    console.error("TEST ERROR:", err);
  } finally {
    mongoose.connection.close();
  }
}

run();
