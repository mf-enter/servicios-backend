import express from "express";
import cors from "cors";
import path from "path";

import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { pool } from "./config/db.js";

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.get("/api/db-test", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/debug-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as ok");
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/health", (req, res) =>
  res.json({ status: true, message: "API OK" })
);

app.use("/api", routes);

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "dist")));

/* FIX SPA SAFE */
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use(errorHandler);

export default app;