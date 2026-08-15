import express from "express"
import cors from "cors"
import { PORT } from "./config.js"
import connectDB from "./db.js"
import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";
import userRoutes from "./Routes/userRoutes.js";
import { logger } from "./Middleware/Middleware.js";
import productRoutes from "./Routes/productRoutes.js";
import orderrouter from "./Routes/orderRoutes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./services/swagger.js";
import cookieParser from "cookie-parser";
import posRouter from "./Routes/posRoutes.js";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"])

const app = express()

app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser());
app.use(logger)

app.use(async (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
        return next();
    }
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(503).json({ message: "Database unavailable, please retry" });
    }
});

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is Running!",
        env: process.env.NODE_ENV
    })
})

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/Api",     userRoutes)
app.use("/Product", productRoutes)
app.use("/Order",   orderrouter)
app.use("/POS",     posRouter)

async function startServer() {
    await connectDB();
    if (process.env.NODE_ENV !== "production") {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
}

startServer().catch(err => console.error("Startup error:", err));

export default app;