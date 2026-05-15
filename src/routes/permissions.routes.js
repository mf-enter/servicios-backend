import { Router } from "express";
import { getPermissions, createPermission } from "../controllers/PermissionController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();
router.get("/", authToken, isAdmin, getPermissions);
router.post("/", authToken, isAdmin, createPermission);

export default router;