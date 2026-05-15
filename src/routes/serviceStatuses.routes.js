import { Router } from "express";
import { getServiceStatuses, createServiceStatus } from "../controllers/ServiceStatusController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getServiceStatuses);
router.post("/", authToken, createServiceStatus);

export default router;