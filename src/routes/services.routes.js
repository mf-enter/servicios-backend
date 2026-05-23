import { Router } from "express";
import { getServices, getService, createService, updateService, deleteService, requestService, assignWorker, getServicesByStatus, getLiveServices, updateServiceStatus, cancelService, createQuote } from "../controllers/ServiceController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/", getServices);
router.get("/:id", getService);
router.get("/status/:statusId", authToken, isAdmin, getServicesByStatus);
router.get("/live", authToken, isAdmin, getLiveServices);

router.post("/", authToken, createService);
router.post("/request", authToken, requestService); // ✅ acepta worker_id
router.post("/:id/quote", authToken, createQuote);
router.patch("/:id/assign-worker", authToken, isAdmin, assignWorker);
router.patch("/:id/status", authToken, updateServiceStatus);
router.patch("/:id/cancel", authToken, cancelService);

router.put("/:id", authToken, updateService);
router.delete("/:id", authToken, deleteService);

export default router;