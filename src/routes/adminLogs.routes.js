import { Router } from "express";
import { getAdminLogs, createAdminLog } from "../controllers/AdminLogController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();
router.get("/", authToken, isAdmin, getAdminLogs);
router.post("/", authToken, isAdmin, createAdminLog);

export default router;