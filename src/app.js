import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const clientDistPath = path.join(projectRoot, "dist");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasClientBuild = fs.existsSync(clientIndexPath);

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  /* SPA fallback only when the built client is present. */
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();

    res.sendFile(clientIndexPath);
  });
}

app.use(errorHandler);

export default app;