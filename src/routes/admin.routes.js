import { Router } from "express";
import { getAdminDashboard, getAdminServices, getWorkerAgenda, listAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin } from "../controllers/AdminController.js";
import { getAdminLogs } from "../controllers/AdminLogController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/dashboard", authToken, isAdmin, getAdminDashboard);
router.get("/services", authToken, isAdmin, getAdminServices);
router.get("/worker-agenda", authToken, isAdmin, getWorkerAgenda);
router.get("/notifications", authToken, isAdmin, getAdminLogs);

// Admin management
router.get("/list", authToken, isAdmin, listAdmins);
router.get("/:id", authToken, isAdmin, getAdminById);
router.post("/", authToken, isAdmin, createAdmin);
router.put("/:id", authToken, isAdmin, updateAdmin);
router.delete("/:id", authToken, isAdmin, deleteAdmin);

export default router;