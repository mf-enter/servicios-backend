import { pool } from "../config/db.js";

const schemaCache = {
  ready: null,
  serviceColumns: new Set(),
  addressColumns: new Set(),
  paymentColumns: new Set()
};

const loadSchemaInfo = async () => {
  if (schemaCache.ready) return schemaCache.ready;
  schemaCache.ready = (async () => {
    const [rows] = await pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name IN ('services', 'addresses', 'payments')`
    );

    for (const row of rows) {
      if (row.table_name === "services") schemaCache.serviceColumns.add(row.column_name);
      if (row.table_name === "addresses") schemaCache.addressColumns.add(row.column_name);
      if (row.table_name === "payments") schemaCache.paymentColumns.add(row.column_name);
    }
    return schemaCache;
  })();
  return schemaCache.ready;
};

const hasServiceColumn = async (columnName) => {
  await loadSchemaInfo();
  return schemaCache.serviceColumns.has(columnName);
};

const buildServiceSelect = async () => {
  await loadSchemaInfo();

  const addressSelect = schemaCache.serviceColumns.has("address_id")
    ? `
      s.address_id,
      s.scheduled_date,
      s.started_at,
      s.finished_at,
      a.street_name,
      a.ext_number,
      a.int_number,
      a.phone_number AS address_phone_number,
      a.address_type,
      pc.postal_code,
      ci.city_name,
      stt.state_name,
      co.country_name,`
    : `
      NULL AS address_id,
      NULL AS scheduled_date,
      NULL AS started_at,
      NULL AS finished_at,`;

  const addressJoin = schemaCache.serviceColumns.has("address_id")
    ? `
    LEFT JOIN addresses a ON a.address_id = s.address_id
    LEFT JOIN postal_codes pc ON pc.postal_code_id = a.postal_code_id
    LEFT JOIN cities ci ON ci.city_id = pc.city_id
    LEFT JOIN states stt ON stt.state_id = pc.state_id
    LEFT JOIN countries co ON co.country_id = pc.country_id`
    : "";

  return `
    SELECT s.service_id,
      s.service_type_id,
      t.service_name AS service_type_name,
      s.client_id,
      c.name AS client_name,
      c.lastname AS client_lastname,
      c.email AS client_email,
      NULL AS client_phone,
      s.worker_id,
      w.name AS worker_name,
      w.lastname AS worker_lastname,
      w.email AS worker_email,
      NULL AS worker_phone,
      ${addressSelect}
      s.request_date,
      s.description,
      s.status_id,
      ss.status_name,
      p.status AS payment_status,
      p.transaction_reference,
      p.payment_method_id,
      p.amount AS payment_amount,
      p.amount AS estimated_price,
      p.pay_date
    FROM services s
    LEFT JOIN service_types t ON s.service_type_id = t.service_type_id
    LEFT JOIN users c ON s.client_id = c.user_id
    LEFT JOIN workers w ON s.worker_id = w.worker_id
    LEFT JOIN service_statuses ss ON s.status_id = ss.status_id
    LEFT JOIN payments p ON p.service_id = s.service_id
    ${addressJoin}
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
    return rows;
  },
  // src/models/Service.js
findByWorker: async (workerId) => {
  const baseSelect = await buildServiceSelect();
  const [rows] = await pool.query(
    `${baseSelect} WHERE s.worker_id=? ORDER BY s.service_id DESC`,
    [workerId]
  );
  return rows;
},
  findByStatus: async (statusId) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(`${baseSelect} WHERE s.status_id=? ORDER BY s.service_id DESC`, [statusId]);
    return rows;
  },
  findLive: async ({ since_id, status_id }) => {
    const baseSelect = await buildServiceSelect();
    let sql = `${baseSelect} WHERE 1=1`;
    const params = [];
    if (since_id) { sql += " AND s.service_id > ?"; params.push(since_id); }
    if (status_id) { sql += " AND s.status_id = ?"; params.push(status_id); }
    sql += " ORDER BY s.service_id DESC LIMIT 100";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  findByClient: async (clientId) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(`${baseSelect} WHERE s.client_id=? ORDER BY s.service_id DESC`, [clientId]);
    return rows;
  },
  findById: async (id) => {
    const baseSelect = await buildServiceSelect();
    const [rows] = await pool.query(`${baseSelect} WHERE s.service_id=? LIMIT 1`, [id]);
    return rows[0];
  },
  findStatusIdByName: async (statusName) => {
    return getServiceStatusId(statusName);
  },
  create: async (data) => {
    await loadSchemaInfo();
    const columns = [];
    const placeholders = [];
    const bindValues = [];

    const pushValue = (column, value) => {
      columns.push(column);
      placeholders.push("?");
      bindValues.push(value);
    };

    pushValue("service_type_id", data.service_type_id);
    pushValue("client_id", data.client_id);
    pushValue("worker_id", data.worker_id ?? null);

    if (schemaCache.serviceColumns.has("address_id")) {
      pushValue("address_id", data.address_id ?? null);
    }

    pushValue("description", data.description);

    if (schemaCache.serviceColumns.has("started_at")) {
      pushValue("started_at", data.started_at ?? null);
    }

    if (schemaCache.serviceColumns.has("finished_at")) {
      pushValue("finished_at", data.finished_at ?? null);
    }

    pushValue("request_date", new Date());
    pushValue("status_id", data.status_id ?? 1);
    pushValue("created_at", new Date());
    pushValue("updated_at", new Date());

    const [result] = await pool.query(
      `INSERT INTO services (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
      bindValues
    );
    return result.insertId;
  },
  update: async (id, data) => {
    await loadSchemaInfo();
    const assignments = ["service_type_id=?", "client_id=?", "worker_id=?", "description=?", "status_id=?"];
    const values = [data.service_type_id, data.client_id, data.worker_id, data.description, data.status_id];

    if (schemaCache.serviceColumns.has("address_id")) {
      assignments.splice(3, 0, "address_id=?");
      values.splice(3, 0, data.address_id ?? null);
    }

    if (schemaCache.serviceColumns.has("started_at") && Object.prototype.hasOwnProperty.call(data, "started_at")) {
      assignments.push("started_at=?");
      values.push(data.started_at);
    }

    if (schemaCache.serviceColumns.has("finished_at") && Object.prototype.hasOwnProperty.call(data, "finished_at")) {
      assignments.push("finished_at=?");
      values.push(data.finished_at);
    }

    assignments.push("updated_at=NOW()");
    values.push(id);

    await pool.query(
      `UPDATE services SET ${assignments.join(", ")} WHERE service_id=?`,
      values
    );
  },
  updateStatus: async (id, statusId) => {
    await loadSchemaInfo();
    const statusName = await (async () => {
      const [rows] = await pool.query("SELECT status_name FROM service_statuses WHERE status_id=? LIMIT 1", [statusId]);
      return rows[0]?.status_name || null;
    })();

    const assignments = ["status_id=?", "updated_at=NOW()"];
    const values = [statusId];

    if (schemaCache.serviceColumns.has("started_at") && normalizeStatus(statusName) === "enprogreso") {
      assignments.splice(1, 0, "started_at = COALESCE(started_at, NOW())");
    }

    if (schemaCache.serviceColumns.has("finished_at") && normalizeStatus(statusName) === "completado") {
      assignments.splice(1, 0, "finished_at = COALESCE(finished_at, NOW())");
    }

    values.push(id);
    await pool.query(`UPDATE services SET ${assignments.join(", ")} WHERE service_id=?`, values);
  },
  remove: async (id) => {
    await pool.query("DELETE FROM services WHERE service_id=?", [id]);
  }
  
};

function normalizeStatus(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");
}