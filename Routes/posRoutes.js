import express from "express";
import {
    fetchPOSProducts,
    fetchPOSProductById,
    fetchPOSCategories,
    fetchPOSInventory
} from "../Controllers/posController.js";
import { protection, isAdmin } from "../Middleware/Middleware.js";

const posRouter = express.Router();

posRouter.get("/products",          protection, isAdmin, fetchPOSProducts);
posRouter.get("/products/:id",      protection, isAdmin, fetchPOSProductById);
posRouter.get("/categories",        protection, isAdmin, fetchPOSCategories);
posRouter.get("/inventory",         protection, isAdmin, fetchPOSInventory);

export default posRouter;