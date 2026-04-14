import express from "express";
import AuthController from "./auth.controller.js";
import { authenticateToken } from "./auth.middleware.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

router.get("/profile", authenticateToken, AuthController.getProfile);
router.post("/change-password", authenticateToken, AuthController.changePassword);

export default router;
