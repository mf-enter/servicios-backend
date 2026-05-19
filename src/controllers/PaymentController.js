import { Payment } from "../models/Payment.js";
import { Service } from "../models/Service.js";

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

const parseAmount = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;

  let s = value.trim();
  // keep digits, dot, comma and minus
  s = s.replace(/[^0-9.,-]/g, "");
  if (s === "") return NaN;

  const hasDot = s.indexOf('.') !== -1;
  const hasComma = s.indexOf(',') !== -1;

  if (hasDot && hasComma) {
    // use the last occurrence as decimal separator
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      // dot is decimal, remove commas (thousands)
      s = s.replace(/,/g, '');
    } else {
      // comma is decimal, remove dots and convert comma to dot
      s = s.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (hasComma && !hasDot) {
    // single comma -> decimal separator
    s = s.replace(/,/g, '.');
  } else {
    // only dots or none: if multiple dots, treat all but last as thousands sep
    const parts = s.split('.');
    if (parts.length > 2) {
      const dec = parts.pop();
      s = parts.join('') + '.' + dec;
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

export const getPayments = async (req, res, next) => {
  try {
    const data = await Payment.findAll();
    res.json({ status: true, data });
  } catch (err) {
    next(err);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { service_id, amount, payment_method_id, transaction_reference } = req.body;

    if (req.body.status != null) {
      throw createHttpError(400, "No se permite el campo status");
    }

    const parsedServiceId = Number(service_id);
    const parsedAmount = parseAmount(amount);

    if (!Number.isInteger(parsedServiceId) || parsedServiceId <= 0) {
      throw createHttpError(400, "service_id inválido");
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw createHttpError(400, "amount inválido");
    }
    if (typeof transaction_reference !== "string" || !transaction_reference.trim()) {
      throw createHttpError(400, "transaction_reference inválido");
    }

    const service = await Service.findById(parsedServiceId);
    if (!service) {
      throw createHttpError(404, "Servicio no encontrado");
    }

    const role = req.user?.role;
    if (role === "user" && Number(service.client_id) !== Number(req.user.user_id)) {
      throw createHttpError(403, "No puedes pagar un servicio que no te pertenece");
    }
       if (role !== "user" && role !== "admin" && role !== "worker") {
      throw createHttpError(403, "No autorizado para registrar pagos");
    }

    if (normalizeStatus(service.status_name) !== "completado") {
      throw createHttpError(409, "Solo puedes pagar cuando el servicio está completado");
    }

    const existingPayment = await Payment.findByServiceId(parsedServiceId);

    // If there's an existing completed payment, block creation
    if (existingPayment && normalizeStatus(existingPayment.status) === "completado") {
      throw createHttpError(422, "Ya existe un pago para este servicio");
    }

    // Ensure transaction reference is unique (unless it belongs to the placeholder being updated)
    const existingReference = await Payment.findByTransactionReference(transaction_reference.trim());
    if (existingReference && (!existingPayment || existingReference.payment_id !== existingPayment.payment_id)) {
      throw createHttpError(409, "transaction_reference ya existe");
    }

    // If a non-completed payment already exists (placeholder created when service marked completed),
    // update that record instead of creating a new one.
    if (existingPayment) {
      await Payment.update(existingPayment.payment_id, {
        service_id: parsedServiceId,
        payment_method_id: payment_method_id ?? null,
        amount: parsedAmount,
        status: "Completado",
        transaction_reference: transaction_reference.trim()
      });

      const payment = await Payment.findById(existingPayment.payment_id);
      return res.json({
        status: true,
        payment_id: payment.payment_id,
        service_id: payment.service_id,
        amount: Number(payment.amount),
        payment_status: payment.status,
        transaction_reference: payment.transaction_reference,
        created_at: payment.created_at,
        payment_method_id: payment.payment_method_id
      });
    }

    const paymentData = {
      service_id: parsedServiceId,
      payment_method_id: payment_method_id ?? null,
      amount: parsedAmount,
      status: "Completado",
      transaction_reference: transaction_reference.trim()
    };

    const id = await Payment.create(paymentData);
    const payment = await Payment.findById(id);

    res.json({
      status: true,
      payment_id: payment.payment_id,
      service_id: payment.service_id,
      amount: Number(payment.amount),
      payment_status: payment.status,
      transaction_reference: payment.transaction_reference,
      created_at: payment.created_at,
      payment_method_id: payment.payment_method_id
    });
  } catch (err) {
    next(err);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    await Payment.update(req.params.id, req.body);
    res.json({ status: true, message: "Pago actualizado" });
  } catch (err) {
    next(err);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    await Payment.remove(req.params.id);
    res.json({ status: true, message: "Pago eliminado" });
  } catch (err) {
    next(err);
  }
};