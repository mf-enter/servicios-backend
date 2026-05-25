import express from "express";
import cors from "cors";
import path from "path";

import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { pool } from "./config/db.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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
  res.json({
    status: true,
    message: "API OK",
    websocket: {
      path: process.env.WS_PATH || "/ws",
      compatibility: ["/", "/ws"]
    }
  })
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