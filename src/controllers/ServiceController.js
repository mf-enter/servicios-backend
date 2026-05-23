import { Service } from "../models/Service.js";
import { ServiceHistory } from "../models/ServiceHistory.js";
import { AdminLog } from "../models/AdminLog.js";
import { ServiceType } from "../models/ServiceType.js";
import { Worker } from "../models/Worker.js";
import { User } from "../models/User.js";
import { UserProfile } from "../models/UserProfile.js";
import { Payment } from "../models/Payment.js";
import { Quote } from "../models/Quote.js";
import notify from "../utils/notify.js";
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

export const getService = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw createHttpError(400, 'ID de servicio inválido');
    const data = await Service.findById(id);
    if (!data) throw createHttpError(404, 'Servicio no encontrado');
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

    const client = await User.findById(client_id);
    if (!client) {
      throw createHttpError(404, "Usuario no encontrado");
    }

    const serviceType = await ServiceType.findById(parsedServiceTypeId);
    if (!serviceType) {
      throw createHttpError(404, "service_type_id no existe");
    }

    const clientProfile = await UserProfile.findByUserId(client_id);
    if (!clientProfile?.address) {
      throw createHttpError(400, "Debes registrar una dirección antes de solicitar el servicio");
    }

    const effectiveAddressId = parsedAddressId ?? client.address_id ?? clientProfile.address_id ?? null;
    if (!effectiveAddressId) {
      throw createHttpError(400, "Debes registrar una dirección antes de solicitar el servicio");
    }

    const addressSnapshot = {
      address_id: effectiveAddressId,
      entity_type: clientProfile.address.entity_type ?? null,
      address_type: clientProfile.address.address_type ?? null,
      street_name: clientProfile.address.street_name ?? null,
      ext_number: clientProfile.address.ext_number ?? null,
      int_number: clientProfile.address.int_number ?? null,
      phone_number: clientProfile.address.phone_number ?? null,
      postal_code: clientProfile.address.postal_code ?? null,
      settlement_name: clientProfile.address.settlement_name ?? null,
      city_name: clientProfile.address.city_name ?? null,
      state_name: clientProfile.address.state_name ?? null,
      country_name: clientProfile.address.country_name ?? null
    };

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
      address_id: effectiveAddressId,
      address_snapshot: addressSnapshot,
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
      changes: JSON.stringify({ service_type_id: parsedServiceTypeId, description: description.trim(), worker_id: parsedWorkerId, address_id: effectiveAddressId }),
      ip_address: req.ip,
      user_agent: req.headers["user-agent"]
    });

    const data = await Service.findById(id);
    res.json({ status: true, message: "Servicio solicitado", id, data });
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

    const data = await Service.findById(service_id);
    res.json({ status: true, message: "Trabajador asignado", worker_id, service_id, data });
  } catch (err) { next(err); }
};

export const updateService = async (req, res, next) => {
  try {
    await Service.update(req.params.id, req.body);

    // If estimated_price provided in update, create/update payment record and mark service as quoted
    if (Object.prototype.hasOwnProperty.call(req.body, "estimated_price") || Object.prototype.hasOwnProperty.call(req.body, "amount")) {
      const serviceId = Number(req.params.id);
      const estimated_price = Number(req.body?.estimated_price ?? req.body?.amount);
      if (Number.isFinite(estimated_price) && estimated_price >= 0) {
        const existingPayment = await Payment.findByServiceId(serviceId);
        if (existingPayment) {
          await Payment.update(existingPayment.payment_id, {
            service_id: serviceId,
            payment_method_id: existingPayment.payment_method_id,
            amount: estimated_price,
            status: existingPayment.status || "Pendiente",
            transaction_reference: existingPayment.transaction_reference
          });
        } else {
          await Payment.create({
            service_id: serviceId,
            payment_method_id: null,
            amount: estimated_price,
            status: "Pendiente",
            transaction_reference: null
          });
        }
        const pendienteId = await Service.findStatusIdByName("Pendiente");
        if (pendienteId) await Service.updateStatus(serviceId, pendienteId);
        await ServiceHistory.create({ service_id: serviceId, status_id: pendienteId || null, changed_by_user_id: req.user?.user_id || null, notes: `Cotización actualizada: ${estimated_price}` });
      }
    }

    res.json({ status: true, message: "Servicio actualizado" });
  } catch (err) { next(err); }
};

export const createQuote = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw createHttpError(400, "ID de servicio inválido");
    }

    const estimated_price = Number(req.body?.estimated_price ?? req.body?.amount);
    if (!Number.isFinite(estimated_price) || estimated_price < 0) {
      throw createHttpError(400, "estimated_price inválido");
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      throw createHttpError(404, "Servicio no encontrado");
    }

    const role = req.user?.role;
    if (role === "worker") {
      if (!service.worker_id || Number(service.worker_id) !== Number(req.user.worker_id)) {
        throw createHttpError(403, "No puedes enviar cotización para este servicio");
      }
    } else if (role !== "admin") {
      throw createHttpError(403, "No autorizado");
    }

    // Create a Quote entry (worker -> quote)
    const quoteId = await Quote.create({ service_id: serviceId, worker_id: req.user?.worker_id || null, amount: estimated_price });

    // Log history
    await ServiceHistory.create({
      service_id: serviceId,
      status_id: service.status_id,
      changed_by_user_id: req.user.user_id,
      notes: `Cotización enviada: ${estimated_price} (quote_id: ${quoteId})`
    });

    // AdminLog
    await AdminLog.create({ admin_user_id: req.user.user_id, action: 'quote_created', entity_type: 'quotes', entity_id: quoteId, changes: JSON.stringify({ amount: estimated_price }), ip_address: req.ip, user_agent: req.headers['user-agent'] });

    // Notify connected clients so the frontend can refresh and show the accept button
    notify.broadcast('quote_created', {
      quote_id: quoteId,
      service_id: serviceId,
      worker_id: req.user?.worker_id || null,
      amount: estimated_price,
      status: 'PENDIENTE'
    });

    const updated = await Service.findById(serviceId);
    res.json({ status: true, message: "Cotización creada", quote_id: quoteId, data: updated });
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
      // Allow the client to accept a quotation (change to 'Aceptado') for their own service only
      if (Number(service.client_id) !== Number(req.user.user_id)) {
        throw createHttpError(403, "No puedes actualizar este servicio");
      }
      if (nextStatus !== "aceptado") {
        throw createHttpError(403, "El cliente solo puede aceptar la cotización (status 'Aceptado')");
      }
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

    const data = await Service.findById(serviceId);
    res.json({ status: true, message: "Servicio actualizado exitosamente", service_id: serviceId, status_name: requestedCanonicalStatus, status_id: nextStatusId, updated_at: new Date().toISOString(), data });
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

    const data = await Service.findById(serviceId);
    res.json({ status: true, message: "Servicio cancelado", service_id: serviceId, data });
  } catch (err) { next(err); }
};