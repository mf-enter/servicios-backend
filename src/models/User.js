import { pool } from "../config/db.js";

let usersHasAddressId;

const tableHasColumn = async (tableName, columnName) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    [tableName, columnName]
  );
  return Number(rows?.[0]?.total || 0) > 0;
};

const hasUsersAddressId = async () => {
  if (typeof usersHasAddressId === "boolean") return usersHasAddressId;
  usersHasAddressId = await tableHasColumn("users", "address_id");
  return usersHasAddressId;
};

export const User = {
  hasAddressColumn: async () => {
    return hasUsersAddressId();
  },
  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },
  findAll: async () => {
    const includeAddressId = await hasUsersAddressId();
    const selectAddress = includeAddressId ? "address_id" : "NULL AS address_id";
    const [rows] = await pool.query(
      `SELECT user_id, name, lastname, email, is_active, user_type_id, ${selectAddress}
       FROM users`
    );
    return rows;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ?", [id]);
    return rows[0];
  },
  create: async (data, db = pool) => {
    const includeAddressId = await hasUsersAddressId();
    const [result] = includeAddressId
      ? await db.query(
        "INSERT INTO users (name, lastname, email, password, user_type_id, address_id, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,1,NOW(),NOW())",
        [data.name, data.lastname, data.email, data.password, data.user_type_id, data.address_id ?? null]
      )
      : await db.query(
        "INSERT INTO users (name, lastname, email, password, user_type_id, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,NOW(),NOW())",
        [data.name, data.lastname, data.email, data.password, data.user_type_id]
      );
    return result.insertId;
  },
  update: async (id, data) => {
    const includeAddressId = await hasUsersAddressId();
    if (includeAddressId) {
      await pool.query(
        "UPDATE users SET name=?, lastname=?, email=?, user_type_id=?, address_id=?, updated_at=NOW() WHERE user_id=?",
        [data.name, data.lastname, data.email, data.user_type_id, data.address_id ?? null, id]
      );
      return;
    }
    await pool.query(
      "UPDATE users SET name=?, lastname=?, email=?, user_type_id=?, updated_at=NOW() WHERE user_id=?",
      [data.name, data.lastname, data.email, data.user_type_id, id]
    );
  },
  remove: async (id) => {
    await pool.query("DELETE FROM users WHERE user_id=?", [id]);
  }
};