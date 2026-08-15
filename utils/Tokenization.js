import jwt from "jsonwebtoken";
export const generateAccessToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role, name: user.firstname },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "2m" }
    );

export const generateRefreshToken = (user) =>
    jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
