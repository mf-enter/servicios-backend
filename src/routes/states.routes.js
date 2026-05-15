import { Router } from "express";
import { getStates, createState } from "../controllers/StateController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", getStates);
router.post("/", authToken, createState);

export default router;