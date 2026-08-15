import express from "express"
import cors from "cors"
import { PORT } from "./config.js"
import connectDB from "./db.js"
import dotenv from "dotenv";
import dns from "dns";
import userRoutes from "./Routes/userRoutes.js";
import fs from "fs";
import { logger } from "./Middleware/Middleware.js";
import productRoutes from "./Routes/productRoutes.js";
import orderrouter from "./Routes/orderRoutes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./services/swagger.js";
import cookieParser from "cookie-parser";
import posRouter from "./Routes/posRoutes.js";
dns.setServers(["1.1.1.1", "8.8.8.8"])
dotenv.config();
const app = express()
app.use(express.json())
app.use(cors())
app.use(logger)
app.use(cookieParser());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/Api", userRoutes)
app.use("/Product", productRoutes)
app.use("/Order", orderrouter)
app.use("/POS", posRouter);
app.listen(PORT, () => {
    connectDB(),
        console.log(`Server is Running on ${PORT}`)
})
