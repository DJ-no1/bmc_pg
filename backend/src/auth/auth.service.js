import bcryptjs from "bcryptjs";
import crypto from "crypto";
import UserModel from "./auth.model.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../common/utils/jwt.utils.js";
import { sendVerificationEmail } from "../common/config/email.js";

class AuthService {
    static async register(email, password, name) {
        const userExists = await UserModel.emailExists(email);
        if (userExists) {
            throw new Error("Email already registered");
        }

        if (!email || !password || !name) {
            throw new Error("Email, password, and name are required");
        }

        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const salt = await bcryptjs.genSalt(10);
        const passwordHash = await bcryptjs.hash(password, salt);

        const user = await UserModel.createUser(email, passwordHash, name);

        // Generate verification token (valid for 24 hours)
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await UserModel.saveVerificationToken(user.id, verificationToken, expiresAt);

        // Send verification email
        try {
            await sendVerificationEmail(user.email, verificationToken, user.name);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // Don't fail registration if email fails, but log the error
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified: user.is_verified,
            },
            accessToken,
            refreshToken,
            message: "Registration successful. Please check your email to verify your account.",
        };
    }

    static async login(email, password) {
        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        // Check if email is verified
        if (!user.is_verified) {
            // Resend verification email if expired
            const verificationToken = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await UserModel.saveVerificationToken(user.id, verificationToken, expiresAt);

            try {
                await sendVerificationEmail(user.email, verificationToken, user.name);
            } catch (emailError) {
                console.error("Failed to resend verification email:", emailError);
            }

            throw new Error("Email not verified. Verification email has been sent to your inbox.");
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified: user.is_verified,
            },
            accessToken,
            refreshToken,
        };
    }

    static async verifyEmail(token) {
        if (!token) {
            throw new Error("Verification token is required");
        }

        const user = await UserModel.verifyEmail(token);

        if (!user) {
            throw new Error("Invalid or expired verification token");
        }

        return {
            message: "Email verified successfully!",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_verified: user.is_verified,
            },
        };
    }

    static async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new Error("Refresh token required");
        }

        try {
            const decoded = verifyRefreshToken(refreshToken);
            const user = await UserModel.findById(decoded.id);

            if (!user) {
                throw new Error("User not found");
            }

            const newAccessToken = generateAccessToken({ id: user.id, email: user.email });

            return { accessToken: newAccessToken };
        } catch (error) {
            throw new Error("Invalid or expired refresh token");
        }
    }

    static async changePassword(userId, oldPassword, newPassword) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const userWithHash = await UserModel.findByEmail(user.email);
        const isPasswordValid = await bcryptjs.compare(oldPassword, userWithHash.password_hash);

        if (!isPasswordValid) {
            throw new Error("Current password is incorrect");
        }

        if (newPassword.length < 6) {
            throw new Error("New password must be at least 6 characters");
        }

        const salt = await bcryptjs.genSalt(10);
        const newPasswordHash = await bcryptjs.hash(newPassword, salt);

        const updatedUser = await UserModel.updatePassword(userId, newPasswordHash);

        return {
            message: "Password changed successfully",
            user: updatedUser,
        };
    }

    static async getProfile(userId) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
}

export default AuthService;
