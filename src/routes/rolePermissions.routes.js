import { Router } from "express";
import { getRolePermissions, createRolePermission } from "../controllers/RolePermissionController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();
router.get("/", authToken, isAdmin, getRolePermissions);
router.post("/", authToken, isAdmin, createRolePermission);

export default router;