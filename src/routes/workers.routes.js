import { Router } from "express";
import { getWorkers, getWorker, createWorker, updateWorker, deleteWorker, getMyWorkerHistory, getMyWorkerServices, verifyWorker } from "../controllers/WorkerController.js";
import { authToken } from "../middleware/authToken.js";
import { isWorker } from "../middleware/isWorker.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/", getWorkers);
router.get("/me/services", authToken, isWorker, getMyWorkerServices);
router.get("/me/history", authToken, isWorker, getMyWorkerHistory);
router.get("/:id", getWorker);
router.post("/", authToken, isAdmin, createWorker);
router.put("/:id", authToken, isAdmin, updateWorker);
router.patch("/:id/verify", authToken, isAdmin, verifyWorker);
router.delete("/:id", authToken, isAdmin, deleteWorker);

export default router;
