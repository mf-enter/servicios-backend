import { pool } from "../config/db.js";

const DEFAULT_SERVICE_TYPES = [
  {
    service_name: "Cerrajero",
    description: "Apertura, reparación y cambio de cerraduras"
  },
  {
    service_name: "Limpieza",
    description: "Servicios de limpieza residencial y comercial"
  },
  {
    service_name: "Pintor",
    description: "Pintura y retoques para interiores y exteriores"
  },
  {
    service_name: "Plomero",
    description: "Instalación, reparación y mantenimiento de tuberías"
  },
  {
    service_name: "Carpintero",
    description: "Fabricación, ajuste y reparación de madera"
  },
  {
    service_name: "Electricista",
    description: "Instalaciones y reparaciones eléctricas"
  }
];

export const ServiceType = {
  ensureDefaults: async () => {
    for (const serviceType of DEFAULT_SERVICE_TYPES) {
      const [rows] = await pool.query(
        "SELECT service_type_id FROM service_types WHERE LOWER(service_name) = LOWER(?) LIMIT 1",
        [serviceType.service_name]
      );

      if (!rows.length) {
        await pool.query(
          "INSERT INTO service_types (service_name, description, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
          [serviceType.service_name, serviceType.description]
        );
      }
    }
  },

  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM service_types");
    return rows;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM service_types WHERE service_type_id = ?", [id]);
    return rows[0];
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO service_types (service_name, description, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [data.service_name, data.description]
    );
    return r.insertId;
  }
};

