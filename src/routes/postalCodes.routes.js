import { Router } from "express";
import { getPostalCodes, createPostalCode } from "../controllers/PostalCodeController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", getPostalCodes);
router.post("/", authToken, createPostalCode);

export default router;