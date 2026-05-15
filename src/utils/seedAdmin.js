import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
dotenv.config();

const run = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  if (rows.length > 0) {
    console.log("Admin ya existe");
    process.exit();
  }

  await pool.query(
    "INSERT INTO users (name, lastname, email, password, user_type_id, is_active, created_at, updated_at) VALUES ('Admin','Principal',?,?,1,1,NOW(),NOW())",
    [email, password]
  );

  console.log("Admin creado correctamente");
  process.exit();
};

run();