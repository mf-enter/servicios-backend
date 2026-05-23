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

const shapeAddress = (row) => {
  if (!row?.address_id) return null;
  return {
    address_id: row.address_id,
    entity_type: row.entity_type ?? null,
    address_type: row.address_type ?? null,
    street_name: row.street_name ?? null,
    ext_number: row.ext_number ?? null,
    int_number: row.int_number ?? null,
    phone_number: row.phone_number ?? null,
    postal_code: row.postal_code ?? null,
    settlement_name: row.settlement_name ?? null,
    city_name: row.city_name ?? null,
    state_name: row.state_name ?? null,
    country_name: row.country_name ?? null
  };
};

export const UserProfile = {
  findByUserId: async (userId) => {
    const includeAddressId = await hasUsersAddressId();
    const selectAddress = includeAddressId
      ? `u.address_id,
              a.entity_type,
              a.address_type,
              a.street_name,
              a.ext_number,
              a.int_number,
              a.phone_number,
              pc.postal_code,
              pc.settlement_name,
              ci.city_name,
              st.state_name,
              co.country_name`
      : `NULL AS address_id,
              NULL AS entity_type,
              NULL AS address_type,
              NULL AS street_name,
              NULL AS ext_number,
              NULL AS int_number,
              NULL AS phone_number,
              NULL AS postal_code,
              NULL AS settlement_name,
              NULL AS city_name,
              NULL AS state_name,
              NULL AS country_name`;
    const joinsAddress = includeAddressId
      ? `LEFT JOIN addresses a ON u.address_id = a.address_id
       LEFT JOIN postal_codes pc ON a.postal_code_id = pc.postal_code_id
       LEFT JOIN cities ci ON pc.city_id = ci.city_id
       LEFT JOIN states st ON ci.state_id = st.state_id
       LEFT JOIN countries co ON st.country_id = co.country_id`
      : "";

    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.lastname, u.email,
              ${selectAddress},
              up.avatar_url, up.created_at, up.updated_at
       FROM users u
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       ${joinsAddress}
       WHERE u.user_id = ?`,
      [userId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      user_id: row.user_id,
      name: row.name,
      lastname: row.lastname,
      email: row.email,
      avatar_url: row.avatar_url ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      address_id: row.address_id ?? null,
      address: shapeAddress(row)
    };
  },
  create: async (userId, avatar_url = null) => {
    const [r] = await pool.query(
      "INSERT INTO user_profiles (user_id, avatar_url, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [userId, avatar_url]
    );
    return r.insertId;
  },
  updateAvatar: async (userId, avatar_url) => {
    await pool.query("UPDATE user_profiles SET avatar_url=?, updated_at=NOW() WHERE user_id=?", [avatar_url, userId]);
  },
  update: async (userId, data) => {
    // Ensure profile row exists
    const [rows] = await pool.query("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO user_profiles (user_id, avatar_url, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
        [userId, data.avatar_url ?? null]
      );
      return;
    }
    await pool.query(
      "UPDATE user_profiles SET avatar_url=?, updated_at=NOW() WHERE user_id=?",
      [data.avatar_url ?? null, userId]
    );
  }
};