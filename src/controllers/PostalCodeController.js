import { PostalCode } from "../models/PostalCode.js";

export const getPostalCodes = async (req, res, next) => {
  try { res.json({ status: true, data: await PostalCode.findAll() }); }
  catch (err) { next(err); }
};

export const createPostalCode = async (req, res, next) => {
  try { res.json({ status: true, id: await PostalCode.create(req.body) }); }
  catch (err) { next(err); }
};