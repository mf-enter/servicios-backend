import { Router } from "express";
import { getDocuments, createDocument } from "../controllers/DocumentController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getDocuments);
router.post("/", authToken, createDocument);

export default router;