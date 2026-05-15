import { PaymentMethod } from "../models/PaymentMethod.js";

export const getPaymentMethods = async (req, res, next) => {
  try { res.json({ status: true, data: await PaymentMethod.findAll() }); }
  catch (err) { next(err); }
};

export const createPaymentMethod = async (req, res, next) => {
  try { res.json({ status: true, id: await PaymentMethod.create(req.body) }); }
  catch (err) { next(err); }
};