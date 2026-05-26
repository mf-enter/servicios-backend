import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function buildSslConfig() {
  const sslEnabled = parseBoolean(process.env.DB_SSL, false);
  const caFromEnv = process.env.DB_SSL_CA;
  const caPath = process.env.DB_SSL_CA_PATH;

  if (!sslEnabled && !caFromEnv && !caPath) return undefined;

  const ssl = {
    rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true)
  };

  if (caFromEnv) {
    ssl.ca = caFromEnv;
  }

  if (caPath && fs.existsSync(caPath)) {
    ssl.ca = fs.readFileSync(caPath, "utf8");
  }

  return ssl;
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  ssl: buildSslConfig(),
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection()
  .then(conn => {
    console.log("🟢 DB CONNECTED SUCCESSFULLY");
    conn.release();
  })
  .catch(err => {
    console.error("🔴 DB CONNECTION FAILED:", err.message);
  });