import app from "./app";
import dotenv from "dotenv";
import "reflect-metadata";
import { initializeDatabase } from "./config/database";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize backend", error);
    process.exit(1);
  });
