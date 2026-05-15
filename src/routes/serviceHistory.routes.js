import { Router } from "express";
import { getServiceHistory, createServiceHistory } from "../controllers/ServiceHistoryController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getServiceHistory);
router.post("/", authToken, createServiceHistory);

export default router;