import bcryptjs from "bcryptjs";
import UserModel from "./auth.model.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../common/utils/jwt.utils.js";

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

        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            accessToken,
            refreshToken,
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

        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            accessToken,
            refreshToken,
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
