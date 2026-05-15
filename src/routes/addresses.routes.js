import { Router } from "express";
import { getAddresses, createAddress } from "../controllers/AddressController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", authToken, getAddresses);
router.post("/", authToken, createAddress);

export default router;