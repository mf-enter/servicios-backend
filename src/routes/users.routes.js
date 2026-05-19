import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser, getUserHistory, getMyUserServices } from "../controllers/UserController.js";
import { getMyProfile, updateAvatar, updateMyProfile } from "../controllers/UserProfileController.js";
import { authToken } from "../middleware/authToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/", authToken, isAdmin, getUsers);
router.post("/", authToken, isAdmin, createUser);
router.put("/:id", authToken, isAdmin, updateUser);
router.delete("/:id", authToken, isAdmin, deleteUser);

router.get("/me/services", authToken, getMyUserServices);
router.get("/me/history", authToken, getUserHistory);
router.get("/me/profile", authToken, getMyProfile);
router.put("/me/profile", authToken, updateMyProfile);
router.put("/me/avatar", authToken, updateAvatar);

export default router;