import express from "express";
var cors = require("cors");
import { Factory } from "./factory";
import { factory } from "typescript";
import { schedule } from "node-cron";
import { scheduleWeeklyStatisticsEmail } from "./cron-tasks/email-report";

export class Server {
  // private fac: Factory;
  private static app: express.Application;

  static async run() {
    await this.init();
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
    scheduleWeeklyStatisticsEmail();
    console.log("⏰ Weekly statistics email scheduler started");
  }

  static async init() {
    console.log("🛠 Initializing server...");

    // Initialize Factory
    const factory = await Factory.getInstance();

    // Set up cors options
    let corsOptions = {
      origin: "*",
    };

    // Set up Express
    this.app = express();
    this.app.use(cors(corsOptions));
    this.app.use(express.json());

    // Routes
    this.setupRoutes();

    console.log("✅ Server initialized successfully.");
  }
  private static setupRoutes() {
    this.app.use("/", Factory.getInstance().getRoutes().getRouter());
  }
}

// Start the server
Server.run();
