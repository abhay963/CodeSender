import "dotenv/config";
import express from "express";
import cors from "cors";
import sendRoute from "./routes/send.route.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/send", sendRoute);

export default app;
