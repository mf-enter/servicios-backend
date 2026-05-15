import { Router } from "express";
import { getCities, createCity } from "../controllers/CityController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", getCities);
router.post("/", authToken, createCity);

export default router;