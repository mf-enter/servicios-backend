import { pool } from "../config/db.js";

let workersHasAddressId;

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

const hasWorkersAddressId = async () => {
  if (typeof workersHasAddressId === "boolean") return workersHasAddressId;
  workersHasAddressId = await tableHasColumn("workers", "address_id");
  return workersHasAddressId;
};

export const Worker = {
  hasAddressColumn: async () => {
    return hasWorkersAddressId();
  },
  findAll: async () => {
    const [rows] = await pool.query(`SELECT * FROM workers ORDER BY worker_id DESC`);
    return rows;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM workers WHERE worker_id = ?", [id]);
    return rows[0];
  },
  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT * FROM workers WHERE email = ?", [email]);
    return rows[0];
  },
  create: async (data, db = pool) => {
    const includeAddressId = await hasWorkersAddressId();
    const [result] = includeAddressId
      ? await db.query(
        `INSERT INTO workers (name, lastname, email, password, bio, hourly_rate, experience_years, is_verified, is_active, address_id, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,1,?,NOW(),NOW())`,
        [data.name, data.lastname, data.email, data.password || null, data.bio || null, data.hourly_rate || null, data.experience_years || null, data.is_verified ? 1 : 0, data.address_id ?? null]
      )
      : await db.query(
        `INSERT INTO workers (name, lastname, email, password, bio, hourly_rate, experience_years, is_verified, is_active, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
        [data.name, data.lastname, data.email, data.password || null, data.bio || null, data.hourly_rate || null, data.experience_years || null, data.is_verified ? 1 : 0]
      );
    return result.insertId;
  },
  update: async (id, data) => {
    const current = await Worker.findById(id);
    if (!current) return;
    const includeAddressId = await hasWorkersAddressId();
    if (includeAddressId) {
      await pool.query(
        `UPDATE workers SET name=?, lastname=?, email=?, bio=?, hourly_rate=?, experience_years=?, is_verified=?, address_id=?, updated_at=NOW() WHERE worker_id=?`,
        [
          data.name ?? current.name,
          data.lastname ?? current.lastname,
          data.email ?? current.email,
          data.bio ?? current.bio,
          data.hourly_rate ?? current.hourly_rate,
          data.experience_years ?? current.experience_years,
          data.is_verified ?? current.is_verified,
          data.address_id ?? current.address_id ?? null,
          id
        ]
      );
      return;
    }
    await pool.query(
      `UPDATE workers SET name=?, lastname=?, email=?, bio=?, hourly_rate=?, experience_years=?, is_verified=?, updated_at=NOW() WHERE worker_id=?`,
      [
        data.name ?? current.name,
        data.lastname ?? current.lastname,
        data.email ?? current.email,
        data.bio ?? current.bio,
        data.hourly_rate ?? current.hourly_rate,
        data.experience_years ?? current.experience_years,
        data.is_verified ?? current.is_verified,
        id
      ]
    );
  },
  verify: async (id) => {
    await pool.query("UPDATE workers SET is_verified=1, updated_at=NOW() WHERE worker_id=?", [id]);
  },
  remove: async (id) => {
    await pool.query("DELETE FROM workers WHERE worker_id=?", [id]);
  }
};