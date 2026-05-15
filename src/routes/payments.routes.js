import { Router } from "express";
import { getPayments, createPayment, updatePayment, deletePayment } from "../controllers/PaymentController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getPayments);
router.post("/", authToken, createPayment);
router.put("/:id", authToken, updatePayment);
router.delete("/:id", authToken, deletePayment);

export default router;