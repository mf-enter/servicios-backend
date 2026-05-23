import { Quote } from "../models/Quote.js";
import { Service } from "../models/Service.js";
import { AdminLog } from "../models/AdminLog.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const acceptQuote = async (req, res, next) => {
  try {
    const quoteId = Number(req.params.id);
    if (!Number.isInteger(quoteId) || quoteId <= 0) throw createHttpError(400, 'ID inválido');

    const userId = req.user?.user_id;
    if (!userId) throw createHttpError(401, 'Autenticación requerida');

    await Quote.accept(quoteId, userId, req.ip, req.headers['user-agent']);

    // Return updated service
    const quote = await Quote.findById(quoteId);
    const service = await Service.findById(quote.service_id);

    res.json({ status: true, message: 'Cotización aceptada', quote_id: quoteId, data: service });
  } catch (err) { next(err); }
};

export const getQuotesByService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);
    if (!Number.isInteger(serviceId) || serviceId <= 0) throw createHttpError(400, 'ID de servicio inválido');

    const service = await Service.findById(serviceId);
    if (!service) throw createHttpError(404, 'Servicio no encontrado');

    const quotes = await Quote.findByServiceId(serviceId);
    const latestQuote = quotes[0] || null;

    res.json({
      status: true,
      data: quotes,
      latest_quote: latestQuote,
      can_accept: Boolean(latestQuote && latestQuote.status === 'PENDIENTE' && Number(service.client_id) === Number(req.user?.user_id))
    });
  } catch (err) { next(err); }
};

export const cancelQuote = async (req, res, next) => {
  try {
    const quoteId = Number(req.params.id);
    if (!Number.isInteger(quoteId) || quoteId <= 0) throw createHttpError(400, 'ID inválido');
    const userId = req.user?.user_id || null;
    await Quote.cancel(quoteId, userId, req.ip, req.headers['user-agent']);
    res.json({ status: true, message: 'Cotización cancelada', quote_id: quoteId });
  } catch (err) { next(err); }
};

export default { acceptQuote, cancelQuote };
