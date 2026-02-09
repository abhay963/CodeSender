import "dotenv/config";
import express from "express";
import cors from "cors";
import sendRoute from "./routes/send.route.js";

const app = express();
app.use((req, res, next) => {
  console.log("➡️ Incoming request:", {
    method: req.method,
    url: req.url,
    time: new Date().toISOString(),
  });
  next();
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/send", sendRoute);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
