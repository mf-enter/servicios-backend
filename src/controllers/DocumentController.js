import { Document } from "../models/Document.js";

export const getDocuments = async (req, res, next) => {
  try { res.json({ status: true, data: await Document.findAll() }); }
  catch (err) { next(err); }
};

export const createDocument = async (req, res, next) => {
  try { res.json({ status: true, id: await Document.create(req.body) }); }
  catch (err) { next(err); }
};