import { Review } from "../models/Review.js";

export const getReviews = async (req, res, next) => {
  try { res.json({ status: true, data: await Review.findAll() }); }
  catch (err) { next(err); }
};

export const createReview = async (req, res, next) => {
  try { res.json({ status: true, id: await Review.create(req.body) }); }
  catch (err) { next(err); }
};