import { Router } from "express";
import { getUserRoles, createUserRole } from "../controllers/UserRoleController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();
router.get("/", authToken, isAdmin, getUserRoles);
router.post("/", authToken, isAdmin, createUserRole);

export default router;