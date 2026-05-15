import { Router } from "express";
import { getReviews, createReview } from "../controllers/ReviewController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getReviews);
router.post("/", authToken, createReview);

export default router;