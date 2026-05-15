import { Router } from "express";
import { getRoles, createRole } from "../controllers/RoleController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();
router.get("/", authToken, isAdmin, getRoles);
router.post("/", authToken, isAdmin, createRole);

export default router;