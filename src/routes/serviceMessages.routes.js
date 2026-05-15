import { Router } from "express";
import { getServiceMessages, createServiceMessage } from "../controllers/ServiceMessageController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getServiceMessages);
router.post("/", authToken, createServiceMessage);

export default router;