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

export const WorkerProfile = {
  findAll: async () => {
    const includeAddressId = await hasWorkersAddressId();
    const selectAddress = includeAddressId
      ? [
          "w.address_id",
          "a.entity_type",
          "a.address_type",
          "a.street_name",
          "a.ext_number",
          "a.int_number",
          "a.phone_number",
          "pc.postal_code",
          "pc.settlement_name",
          "ci.city_name",
          "st.state_name",
          "co.country_name"
        ]
      : [
          "NULL AS address_id",
          "NULL AS entity_type",
          "NULL AS address_type",
          "NULL AS street_name",
          "NULL AS ext_number",
          "NULL AS int_number",
          "NULL AS phone_number",
          "NULL AS postal_code",
          "NULL AS settlement_name",
          "NULL AS city_name",
          "NULL AS state_name",
          "NULL AS country_name"
        ];
    const joinsAddress = includeAddressId
      ? `LEFT JOIN addresses a ON w.address_id = a.address_id
      LEFT JOIN postal_codes pc ON a.postal_code_id = pc.postal_code_id
      LEFT JOIN cities ci ON pc.city_id = ci.city_id
      LEFT JOIN states st ON ci.state_id = st.state_id
      LEFT JOIN countries co ON st.country_id = co.country_id`
      : "";

    const [rows] = await pool.query(`
      SELECT
        w.worker_id,
        w.name,
        w.lastname,
        w.email,
        ${selectAddress.join(",\n        ")},
        w.bio,
        w.hourly_rate,
        w.experience_years,
        w.is_verified
      FROM workers w
      ${joinsAddress}
      WHERE w.is_active = 1
    `);
    return rows.map((row) => ({
      worker_id: row.worker_id,
      name: row.name,
      lastname: row.lastname,
      email: row.email,
      bio: row.bio ?? null,
      hourly_rate: row.hourly_rate ?? null,
      experience_years: row.experience_years ?? null,
      is_verified: row.is_verified ?? null,
      address_id: row.address_id ?? null,
      address: shapeAddress(row)
    }));
  },
  create: async (userId, db = pool) => {
    return userId;
  }
  ,
  findByUserId: async (userId) => {
    const includeAddressId = await hasWorkersAddressId();
    const selectAddress = includeAddressId
      ? [
          "w.address_id",
          "a.entity_type",
          "a.address_type",
          "a.street_name",
          "a.ext_number",
          "a.int_number",
          "a.phone_number",
          "pc.postal_code",
          "pc.settlement_name",
          "ci.city_name",
          "st.state_name",
          "co.country_name"
        ]
      : [
          "NULL AS address_id",
          "NULL AS entity_type",
          "NULL AS address_type",
          "NULL AS street_name",
          "NULL AS ext_number",
          "NULL AS int_number",
          "NULL AS phone_number",
          "NULL AS postal_code",
          "NULL AS settlement_name",
          "NULL AS city_name",
          "NULL AS state_name",
          "NULL AS country_name"
        ];
    const joinsAddress = includeAddressId
      ? `LEFT JOIN addresses a ON w.address_id = a.address_id
       LEFT JOIN postal_codes pc ON a.postal_code_id = pc.postal_code_id
       LEFT JOIN cities ci ON pc.city_id = ci.city_id
       LEFT JOIN states st ON ci.state_id = st.state_id
       LEFT JOIN countries co ON st.country_id = co.country_id`
      : "";

    const [rows] = await pool.query(
      `SELECT
        w.worker_id,
        w.name,
        w.lastname,
        w.email,
        ${selectAddress.join(",\n        ")},
        w.bio,
        w.hourly_rate,
        w.experience_years,
        w.is_verified
       FROM workers w
       ${joinsAddress}
       WHERE w.worker_id = ?
       LIMIT 1`,
      [userId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      worker_id: row.worker_id,
      name: row.name,
      lastname: row.lastname,
      email: row.email,
      bio: row.bio ?? null,
      hourly_rate: row.hourly_rate ?? null,
      experience_years: row.experience_years ?? null,
      is_verified: row.is_verified ?? null,
      address_id: row.address_id ?? null,
      address: shapeAddress(row)
    };
  },
  update: async (userId, data) => {
    const current = await pool.query("SELECT * FROM workers WHERE worker_id = ? LIMIT 1", [userId]);
    const currentRow = current[0][0];
    if (!currentRow) return;
    await pool.query(
      "UPDATE workers SET bio=?, hourly_rate=?, experience_years=?, is_verified=?, address_id=?, updated_at=NOW() WHERE worker_id=?",
      [
        data.bio ?? currentRow.bio ?? null,
        data.hourly_rate ?? currentRow.hourly_rate ?? null,
        data.experience_years ?? currentRow.experience_years ?? null,
        data.is_verified ?? currentRow.is_verified ?? 0,
        data.address_id ?? currentRow.address_id ?? null,
        userId
      ]
    );
  }
};