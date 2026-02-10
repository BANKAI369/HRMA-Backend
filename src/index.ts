import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// health check
app.get("/", (_req, res) => {
  res.send("TypeScript backend running");
});



export default app;
