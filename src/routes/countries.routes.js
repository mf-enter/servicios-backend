import { Router } from "express";
import { getCountries, createCountry } from "../controllers/CountryController.js";
import { authToken } from "../middleware/authToken.js";

const router = Router();
router.get("/", getCountries);
router.post("/", authToken, createCountry);

export default router;