import { Router } from "express";
import { getPaymentMethods, createPaymentMethod } from "../controllers/PaymentMethodController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getPaymentMethods);
router.post("/", authToken, createPaymentMethod);

export default router;