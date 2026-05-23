import { pool } from "../config/db.js";

let serviceColumnsCache = null;

async function getServiceColumns() {
  if (serviceColumnsCache) return serviceColumnsCache;

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'services'`
  );

  serviceColumnsCache = new Set(rows.map((row) => row.COLUMN_NAME));
  return serviceColumnsCache;
}

const buildServiceSelect = async () => {
  const serviceColumns = await getServiceColumns();
  const estimatedPriceSelect = serviceColumns.has("estimated_price")
    ? "s.estimated_price AS estimated_price"
    : "NULL AS estimated_price";

  return `
    SELECT 
      s.service_id,
      s.service_type_id,
      t.service_name AS service_type_name,
      s.client_id,
      c.name AS client_name,
      c.lastname AS client_lastname,
      c.email AS client_email,
      s.worker_id,
      w.name AS worker_name,
      w.lastname AS worker_lastname,
      w.email AS worker_email,
      s.address_id,
      a.street_name,
      a.ext_number,
      a.int_number,
      a.phone_number,
      a.address_type,
      pc.postal_code,
      ci.city_name,
      st.state_name,
      co.country_name,
      q.quote_id AS latest_quote_id,
      q.service_id AS latest_quote_service_id,
      q.worker_id AS latest_quote_worker_id,
      q.amount AS latest_quote_amount,
      q.status AS latest_quote_status,
      q.transaction_reference AS latest_quote_transaction_reference,
      q.created_at AS latest_quote_created_at,
      q.updated_at AS latest_quote_updated_at,
      -- Client address (from users.address_id)
      ca.address_id AS client_address_id,
      ca.street_name AS client_street_name,
      ca.ext_number AS client_ext_number,
      ca.int_number AS client_int_number,
      ca.phone_number AS client_phone_number,
      ca.address_type AS client_address_type,
      cpc.postal_code AS client_postal_code,
      cci.city_name AS client_city_name,
      cst.state_name AS client_state_name,
      cco.country_name AS client_country_name,
      -- Worker address (from workers.address_id)
      wa.address_id AS worker_address_id,
      wa.street_name AS worker_street_name,
      wa.ext_number AS worker_ext_number,
      wa.int_number AS worker_int_number,
      wa.phone_number AS worker_phone_number,
      wa.address_type AS worker_address_type,
      wpc.postal_code AS worker_postal_code,
      wci.city_name AS worker_city_name,
      wst.state_name AS worker_state_name,
      wco.country_name AS worker_country_name,
      s.requested_at,
      s.accepted_at,
      s.started_at,
      s.finished_at,
      s.description,
      ${estimatedPriceSelect},
      s.status_id,
      ss.status_name,
      p.payment_id,
      p.status AS payment_status,
      p.transaction_reference,
      p.payment_method_id,
      p.amount AS payment_amount,
      p.pay_date,
      s.request_date,
      s.created_at,
      s.updated_at
    FROM services s
    LEFT JOIN service_types t ON s.service_type_id = t.service_type_id
    LEFT JOIN users c ON s.client_id = c.user_id
    LEFT JOIN workers w ON s.worker_id = w.worker_id
    LEFT JOIN service_statuses ss ON s.status_id = ss.status_id
    LEFT JOIN payments p ON p.service_id = s.service_id
    LEFT JOIN addresses a ON a.address_id = s.address_id
    LEFT JOIN postal_codes pc ON pc.postal_code_id = a.postal_code_id
    LEFT JOIN cities ci ON ci.city_id = pc.city_id
    LEFT JOIN states st ON st.state_id = ci.state_id
    LEFT JOIN countries co ON co.country_id = st.country_id
    -- client address joins
    LEFT JOIN addresses ca ON ca.address_id = c.address_id
    LEFT JOIN postal_codes cpc ON cpc.postal_code_id = ca.postal_code_id
    LEFT JOIN cities cci ON cci.city_id = cpc.city_id
    LEFT JOIN states cst ON cst.state_id = cci.state_id
    LEFT JOIN countries cco ON cco.country_id = cst.country_id
    -- worker address joins
    LEFT JOIN addresses wa ON wa.address_id = w.address_id
    LEFT JOIN postal_codes wpc ON wpc.postal_code_id = wa.postal_code_id
    LEFT JOIN cities wci ON wci.city_id = wpc.city_id
    LEFT JOIN states wst ON wst.state_id = wci.state_id
    LEFT JOIN countries wco ON wco.country_id = wst.country_id
    LEFT JOIN quotes q ON q.quote_id = (
      SELECT qq.quote_id
      FROM quotes qq
      WHERE qq.service_id = s.service_id
      ORDER BY qq.quote_id DESC
      LIMIT 1
    )
  `;
};

const getServiceStatusId = async (serviceName) => {
  const [rows] = await pool.query("SELECT status_id, status_name FROM service_statuses");
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
  const target = normalize(serviceName);
  const found = rows.find((row) => normalize(row.status_name) === target);
  return found ? found.status_id : null;
};

export const Service = {
  findAll: async () => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(`${baseSelect} ORDER BY s.service_id DESC`);
    return rows.map(shapeServiceRow);
  },

  findByWorker: async (workerId) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(
      `${baseSelect} WHERE s.worker_id=? ORDER BY s.service_id DESC`,
      [workerId]
    );
    return rows.map(shapeServiceRow);
  },

  findByStatus: async (statusId) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(
      `${baseSelect} WHERE s.status_id=? ORDER BY s.service_id DESC`,
      [statusId]
    );
    return rows.map(shapeServiceRow);
  },

  findLive: async ({ since_id, status_id }) => {
    const baseSelect = await buildServiceSelect();
    let sql = `${baseSelect} WHERE 1=1`;
    const params = [];
    if (since_id) { sql += " AND s.service_id > ?"; params.push(since_id); }
    if (status_id) { sql += " AND s.status_id = ?"; params.push(status_id); }
    sql += " ORDER BY s.service_id DESC LIMIT 100";
    const [rows] = await pool.query(sql, params);
    return rows.map(shapeServiceRow);
  },

  findByClient: async (clientId) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(
      `${baseSelect} WHERE s.client_id=? ORDER BY s.service_id DESC`,
      [clientId]
    );
    return rows.map(shapeServiceRow);
  },

  findById: async (id) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(
      `${baseSelect} WHERE s.service_id=? LIMIT 1`,
      [id]
    );
    return shapeServiceRow(rows[0]);
  },

  findStatusIdByName: async (statusName) => {
    return getServiceStatusId(statusName);
  },

  create: async (data) => {
    const [result] = await pool.query(
      `INSERT INTO services 
       (service_type_id, client_id, worker_id, address_id, 
        description, status_id, requested_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.service_type_id,
        data.client_id,
        data.worker_id ?? null,
        data.address_id ?? null,
        data.description,
        data.status_id ?? 1,
        data.requested_at ?? new Date()
      ]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const updates = [];
    const values = [];

    if (data.service_type_id !== undefined) { updates.push("service_type_id=?"); values.push(data.service_type_id); }
    if (data.client_id !== undefined) { updates.push("client_id=?"); values.push(data.client_id); }
    if (data.worker_id !== undefined) { updates.push("worker_id=?"); values.push(data.worker_id); }
    if (data.address_id !== undefined) { updates.push("address_id=?"); values.push(data.address_id); }
    if (data.description !== undefined) { updates.push("description=?"); values.push(data.description); }
    if (data.status_id !== undefined) { updates.push("status_id=?"); values.push(data.status_id); }

    updates.push("updated_at=NOW()");
    values.push(id);

    if (updates.length > 1) {
      await pool.query(
        `UPDATE services SET ${updates.join(", ")} WHERE service_id=?`,
        values
      );
    }
  },

  updateStatus: async (id, statusId) => {
    const [statusRows] = await pool.query(
      "SELECT status_name FROM service_statuses WHERE status_id=? LIMIT 1",
      [statusId]
    );
    const statusName = statusRows[0]?.status_name || null;
    const normalized = normalizeStatus(statusName);

    let timestampUpdate = "";
    
    if (normalized === "aceptado") {
      timestampUpdate = ", accepted_at = COALESCE(accepted_at, NOW())";
    } else if (normalized === "enprogreso") {
      timestampUpdate = ", started_at = COALESCE(started_at, NOW())";
    } else if (normalized === "completado") {
      timestampUpdate = ", finished_at = COALESCE(finished_at, NOW())";
    }

    await pool.query(
      `UPDATE services SET status_id=?, updated_at=NOW() ${timestampUpdate} WHERE service_id=?`,
      [statusId, id]
    );
  },

  remove: async (id) => {
    await pool.query("DELETE FROM services WHERE service_id=?", [id]);
  },

  clearSchemaCache: () => {},
  debugSchemaCache: () => ({ serviceColumns: [] })
};

function normalizeStatus(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");
}

function shapeServiceRow(row) {
  if (!row) return null;

  const serviceAmount = row.payment_amount ?? row.latest_quote_amount ?? null;
  const latestQuote = row.latest_quote_id
    ? {
        quote_id: row.latest_quote_id,
        service_id: row.latest_quote_service_id,
        worker_id: row.latest_quote_worker_id,
        amount: row.latest_quote_amount,
        status: row.latest_quote_status,
        transaction_reference: row.latest_quote_transaction_reference,
        created_at: row.latest_quote_created_at,
        updated_at: row.latest_quote_updated_at
      }
    : null;

  return {
    ...row,
    estimated_price: row.estimated_price ?? serviceAmount,
    service_amount: serviceAmount,
    amount: serviceAmount,
    amount_source: row.payment_amount != null ? 'payment' : (row.latest_quote_amount != null ? 'quote' : null),
    timeline: {
      requested_at: row.requested_at ?? null,
      accepted_at: row.accepted_at ?? null,
      started_at: row.started_at ?? null,
      finished_at: row.finished_at ?? null
    },
    address: row.address_id
      ? {
          address_id: row.address_id,
          street_name: row.street_name ?? null,
          ext_number: row.ext_number ?? null,
          int_number: row.int_number ?? null,
          phone_number: row.phone_number ?? null,
          address_type: row.address_type ?? null,
          postal_code: row.postal_code ?? null,
          city_name: row.city_name ?? null,
          state_name: row.state_name ?? null,
          country_name: row.country_name ?? null
        }
      : null,
    client_address: row.client_address_id
      ? {
          address_id: row.client_address_id,
          street_name: row.client_street_name ?? null,
          ext_number: row.client_ext_number ?? null,
          int_number: row.client_int_number ?? null,
          phone_number: row.client_phone_number ?? null,
          address_type: row.client_address_type ?? null,
          postal_code: row.client_postal_code ?? null,
          city_name: row.client_city_name ?? null,
          state_name: row.client_state_name ?? null,
          country_name: row.client_country_name ?? null
        }
      : null,
    worker_address: row.worker_address_id
      ? {
          address_id: row.worker_address_id,
          street_name: row.worker_street_name ?? null,
          ext_number: row.worker_ext_number ?? null,
          int_number: row.worker_int_number ?? null,
          phone_number: row.worker_phone_number ?? null,
          address_type: row.worker_address_type ?? null,
          postal_code: row.worker_postal_code ?? null,
          city_name: row.worker_city_name ?? null,
          state_name: row.worker_state_name ?? null,
          country_name: row.worker_country_name ?? null
        }
      : null,
    latest_quote: latestQuote,
      quote: latestQuote
  };
}