import { verifyAccessToken } from "../common/utils/jwt.utils.js";

export const authenticateToken = (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Access token required",
			});
		}

		const decoded = verifyAccessToken(token);
		req.user = decoded;
		next();
	} catch (error) {
		console.error("Token verification error:", error.message);

		if (error.message === "jwt expired") {
			return res.status(401).json({
				success: false,
				message: "Access token expired. Please refresh your token.",
			});
		}

		res.status(403).json({
			success: false,
			message: "Invalid token",
		});
	}
};

export const optionalAuth = (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (token) {
			const decoded = verifyAccessToken(token);
			req.user = decoded;
		}
		next();
	} catch (error) {
		next();
	}
};

export const isAdmin = (req, res, next) => {
	if (req.user?.role !== "admin") {
		return res.status(403).json({
			success: false,
			message: "Admin access required",
		});
	}
	next();
};
