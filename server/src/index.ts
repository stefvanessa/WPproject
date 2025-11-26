import express from "express";
import dotenv from "dotenv";

dotenv.config(); // MUST RUN BEFORE ANY OTHER IMPORT THAT USES process.env

import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes";
import session from "express-session";
import passport from "./config/passport";
import authRoutes from "./routes/authRoutes";
import uploadRoutes from "./routes/uploadRoutes";


const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/mydb";

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,     // REQUIRED for localhost + curl
      sameSite: "lax",   // allows cookie via curl/postman
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, _, next) => {
  console.log("RAW COOKIE:", req.headers.cookie);
  console.log("SESSION DATA:", req.session);
  console.log("USER:", req.user);
  next();
});
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/upload", uploadRoutes); 
app.use("/api/products", productRoutes);


app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.send("Hello from server"));

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB", MONGO_URI);

    app.listen(PORT, () =>
      console.log(`Server listening on port ${PORT}`)
    );
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
}

start();
