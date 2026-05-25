import { Router } from "express";
import { getWorkers, getWorker, createWorker, updateWorker, deleteWorker, getMyWorkerHistory, getMyWorkerServices, verifyWorker } from "../controllers/WorkerController.js";
import { getMyProfile, updateMyProfile } from "../controllers/WorkerProfileController.js";
import { authToken } from "../middleware/authToken.js";
import { isWorker } from "../middleware/isWorker.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/", getWorkers);
router.get("/me/services", authToken, isWorker, getMyWorkerServices);
router.get("/me/history", authToken, isWorker, getMyWorkerHistory);
router.get("/me/profile", authToken, isWorker, getMyProfile);
router.put("/me/profile", authToken, isWorker, updateMyProfile);
router.get("/profile", authToken, isWorker, getMyProfile);
router.put("/profile", authToken, isWorker, updateMyProfile);
router.get("/:id", getWorker);
router.post("/", authToken, isAdmin, createWorker);
router.put("/:id", authToken, isAdmin, updateWorker);
router.patch("/:id/verify", authToken, isAdmin, verifyWorker);
router.delete("/:id", authToken, isAdmin, deleteWorker);

export default router;
