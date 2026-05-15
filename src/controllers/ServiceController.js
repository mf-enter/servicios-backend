import { Service } from "../models/Service.js";
import { ServiceHistory } from "../models/ServiceHistory.js";
import { AdminLog } from "../models/AdminLog.js";
import { ServiceType } from "../models/ServiceType.js";
import { Worker } from "../models/Worker.js";
import { Payment } from "../models/Payment.js";
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeStatus = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

const toCanonicalStatus = (value) => {
  const normalized = normalizeStatus(value);
  const aliases = {
    pendiente: "Pendiente",
    aceptado: "Aceptado",
    enprogreso: "En progreso",
    completado: "Completado",
    cancelado: "Cancelado"
  };
  return aliases[normalized] || null;
};

const ALLOWED_TRANSITIONS = {
  pendiente: new Set(["aceptado", "enprogreso", "cancelado"]),
  aceptado: new Set(["enprogreso", "cancelado"]),
  enprogreso: new Set(["completado", "cancelado"])
};

export const getServices = async (req, res, next) => {
  try {
    const data = await Service.findAll();
    res.json({ status: true, data });
  } catch (err) { next(err); }
};

export const getServicesByStatus = async (req, res, next) => {
  try {
    const data = await Service.findByStatus(req.params.statusId);
    res.json({ status: true, data });
  } catch (err) { next(err); }
};

export const getLiveServices = async (req, res, next) => {
  try {
    const data = await Service.findLive(req.query);
    res.json({ status: true, data });
  } catch (err) { next(err); }
};

export const createService = async (req, res, next) => {
  try {
    const id = await Service.create(req.body);
    res.json({ status: true, message: "Servicio creado", id });
  } catch (err) { next(err); }
};

export const requestService = async (req, res, next) => {
  try {
    const { service_type_id, description, worker_id, address_id } = req.body;
    const client_id = req.user?.user_id;

    if (!client_id) throw createHttpError(401, "Autenticación requerida");

    const parsedServiceTypeId = Number(service_type_id);
    if (!Number.isInteger(parsedServiceTypeId) || parsedServiceTypeId <= 0) {
      throw createHttpError(400, "service_type_id debe ser un número válido");
    }

    if (typeof description !== "string" || !description.trim()) {
      throw createHttpError(400, "description es obligatorio");
    }

    const parsedAddressId = address_id == null || address_id === "" ? null : Number(address_id);
    if (parsedAddressId !== null && (!Number.isInteger(parsedAddressId) || parsedAddressId <= 0)) {
      throw createHttpError(400, "address_id debe ser un número válido");
    }

    const serviceType = await ServiceType.findById(parsedServiceTypeId);
    if (!serviceType) {
      throw createHttpError(404, "service_type_id no existe");
    }

    let parsedWorkerId = null;
    if (worker_id != null && worker_id !== "") {
      parsedWorkerId = Number(worker_id);
      if (!Number.isInteger(parsedWorkerId) || parsedWorkerId <= 0) {
        throw createHttpError(400, "worker_id debe ser un número válido");
      }

      const worker = await Worker.findById(parsedWorkerId);
      if (!worker) {
        throw createHttpError(404, "worker_id no existe");
      }
    }

    const id = await Service.create({
      service_type_id: parsedServiceTypeId,
      client_id,
      worker_id: parsedWorkerId,
      address_id: parsedAddressId,
      description: description.trim(),
      status_id: 1
    });

    await ServiceHistory.create({
      service_id: id,
      status_id: 1,
      changed_by_user_id: client_id,
      notes: parsedWorkerId ? "Servicio solicitado con trabajador asignado" : "Servicio solicitado"
    });

    await AdminLog.create({
      admin_user_id: null,
      action: "service_requested",
      entity_type: "services",
      entity_id: id,
      changes: JSON.stringify({ service_type_id: parsedServiceTypeId, description: description.trim(), worker_id: parsedWorkerId, address_id: parsedAddressId }),
      ip_address: req.ip,
      user_agent: req.headers["user-agent"]
    });

    res.json({ status: true, message: "Servicio solicitado", id });
  } catch (err) { next(err); }
};

export const assignWorker = async (req, res, next) => {
  try {
    const { worker_id } = req.body;
    const service_id = req.params.id;

    const worker = await Worker.findById(worker_id);
    if (!worker) {
      throw createHttpError(400, "worker_id inválido");
    }

    await Service.update(service_id, { worker_id, status_id: 2 });

    await ServiceHistory.create({
      service_id,
      status_id: 2,
      changed_by_user_id: req.user.user_id,
      notes: "Trabajador asignado"
    });

    await AdminLog.create({
      admin_user_id: req.user.user_id,
      action: "worker_assigned",
      entity_type: "services",
      entity_id: service_id,
      changes: JSON.stringify({ worker_id }),
      ip_address: req.ip,
      user_agent: req.headers["user-agent"]
    });

    res.json({ status: true, message: "Trabajador asignado", worker_id, service_id });
  } catch (err) { next(err); }
};

export const updateService = async (req, res, next) => {
  try {
    await Service.update(req.params.id, req.body);
    res.json({ status: true, message: "Servicio actualizado" });
  } catch (err) { next(err); }
};

export const deleteService = async (req, res, next) => {
  try {
    await Service.remove(req.params.id);
    res.json({ status: true, message: "Servicio eliminado" });
  } catch (err) { next(err); }
};

export const updateServiceStatus = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw createHttpError(400, "ID de servicio inválido");
    }

    const requestedCanonicalStatus = toCanonicalStatus(req.body?.status_name ?? req.body?.status);
    if (!requestedCanonicalStatus) {
      throw createHttpError(400, "status_name o status inválido. Use: Pendiente, Aceptado, En progreso, Completado o Cancelado");
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      throw createHttpError(404, "Servicio no encontrado");
    }

    const currentStatus = normalizeStatus(service.status_name);
    const nextStatus = normalizeStatus(requestedCanonicalStatus);
    const role = req.user?.role;

    if (currentStatus === nextStatus) {
      return res.json({ status: true, message: "El servicio ya tenía ese estado", service_id: serviceId, status_name: requestedCanonicalStatus });
    }

    if (currentStatus === "completado" || currentStatus === "cancelado") {
      throw createHttpError(409, "No se puede cambiar el estado cuando el servicio ya está completado o cancelado");
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.has(nextStatus)) {
      throw createHttpError(409, "La transición de estado no es válida");
    }

    if (role === "worker") {
      if (!service.worker_id || Number(service.worker_id) !== Number(req.user.worker_id)) {
        throw createHttpError(403, "No puedes actualizar este servicio");
      }
    } else if (role === "user") {
      throw createHttpError(403, "El cliente no puede actualizar estado directo. Usa el endpoint de cancelación");
    } else if (role !== "admin") {
      throw createHttpError(403, "No autorizado");
    }

    const nextStatusId = await Service.findStatusIdByName(requestedCanonicalStatus);
    if (!nextStatusId) {
      throw createHttpError(400, "No se encontró el estado solicitado en la base de datos");
    }

            await Service.updateStatus(serviceId, nextStatusId);
    await ServiceHistory.create({
      service_id: serviceId,
      status_id: nextStatusId,
      changed_by_user_id: req.user.user_id,
      notes: `Estado actualizado a ${requestedCanonicalStatus}`
    });

    // Crear Payment automático cuando se marca como Completado
    if (nextStatus === "completado") {
      const existingPayment = await Payment.findByServiceId(serviceId);
      if (!existingPayment) {
        const autoTransactionRef = `AUTO-${serviceId}-${Date.now()}`;
        await Payment.create({
          service_id: serviceId,
          payment_method_id: null,
          amount: 0,
          status: "Pendiente",
          transaction_reference: autoTransactionRef
        });
      }
    }

    res.json({ status: true, message: "Servicio actualizado exitosamente", service_id: serviceId, status_name: requestedCanonicalStatus, status_id: nextStatusId, updated_at: new Date().toISOString() });
  } catch (err) { next(err); }
};

export const cancelService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw createHttpError(400, "ID de servicio inválido");
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      throw createHttpError(404, "Servicio no encontrado");
    }

    const currentStatus = normalizeStatus(service.status_name);
    const role = req.user?.role;

    if (role === "user") {
      if (Number(service.client_id) !== Number(req.user.user_id)) {
        throw createHttpError(403, "No puedes cancelar este servicio");
      }
      if (currentStatus !== "pendiente") {
        throw createHttpError(409, "Solo puedes cancelar servicios pendientes");
      }
    } else if (role === "worker") {
      if (!service.worker_id || Number(service.worker_id) !== Number(req.user.worker_id)) {
        throw createHttpError(403, "No puedes cancelar este servicio");
      }
      if (!ACTIVE_STATUSES.has(currentStatus)) {
        throw createHttpError(409, "Solo puedes cancelar servicios activos");
      }
    } else if (role !== "admin") {
      throw createHttpError(403, "No autorizado");
    }

    const cancelStatusId = await Service.findStatusIdByName("Cancelado");
    if (!cancelStatusId) {
      throw createHttpError(400, "No se encontró el estado Cancelado en la base de datos");
    }

    await Service.updateStatus(serviceId, cancelStatusId);
    await ServiceHistory.create({
      service_id: serviceId,
      status_id: cancelStatusId,
      changed_by_user_id: req.user.user_id,
      notes: "Servicio cancelado"
    });

    res.json({ status: true, message: "Servicio cancelado", service_id: serviceId });
  } catch (err) { next(err); }
};