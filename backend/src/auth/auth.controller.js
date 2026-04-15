import AuthService from "./auth.service.js";

class AuthController {
    static async register(req, res) {
        try {
            const { email, password, name } = req.body;
            const result = await AuthService.register(email, password, name);

            res.status(201).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            console.error("Registration error:", error.message);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);

            res.status(200).json({
                success: true,
                message: "Login successful",
                data: result,
            });
        } catch (error) {
            console.error("Login error:", error.message);
            res.status(401).json({
                success: false,
                message: error.message,
            });
        }
    }

    static async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            const result = await AuthService.verifyEmail(token);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.user,
            });
        } catch (error) {
            console.error("Email verification error:", error.message);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthService.refreshAccessToken(refreshToken);

            res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                data: result,
            });
        } catch (error) {
            console.error("Token refresh error:", error.message);
            res.status(401).json({
                success: false,
                message: error.message,
            });
        }
    }

    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            const result = await AuthService.changePassword(
                userId,
                oldPassword,
                newPassword,
            );

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.user,
            });
        } catch (error) {
            console.error("Change password error:", error.message);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await AuthService.getProfile(userId);

            res.status(200).json({
                success: true,
                message: "Profile fetched successfully",
                data: user,
            });
        } catch (error) {
            console.error("Get profile error:", error.message);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    static logout(req, res) {
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
            data: {
                instruction: "Delete tokens from client storage",
            },
        });
    }
}

export default AuthController;
