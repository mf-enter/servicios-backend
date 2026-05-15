import { Router } from "express";
import { getServiceTypes, createServiceType } from "../controllers/ServiceTypeController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", getServiceTypes);
router.post("/", authToken, createServiceType);

export default router;