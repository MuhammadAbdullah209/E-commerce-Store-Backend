
import {
    getPOSProducts,
    getPOSProductById,
    getPOSCategories,
    getPOSInventory
} from "../services/posService.js";

export const fetchPOSProducts = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;

        const allProducts = await getPOSProducts();

        const startIndex = (page - 1) * limit;
        const endIndex   = page * limit;

        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        return res.status(200).json({
            success:     true,
            currentPage: page,
            totalPages:  Math.ceil(allProducts.length / limit),
            totalItems:  allProducts.length,
            itemsPerPage: limit,
            products:    paginatedProducts
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const fetchPOSProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getPOSProductById(id);
        return res.status(200).json({ success: true, product });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const fetchPOSCategories = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;

        const allCategories = await getPOSCategories();

        const startIndex = (page - 1) * limit;
        const endIndex   = page * limit;

        const paginatedCategories = allCategories.slice(startIndex, endIndex);

        return res.status(200).json({
            success:      true,
            currentPage:  page,
            totalPages:   Math.ceil(allCategories.length / limit),
            totalItems:   allCategories.length,
            itemsPerPage: limit,
            categories:   paginatedCategories
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const fetchPOSInventory = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;

        const allInventory = await getPOSInventory();

        const startIndex = (page - 1) * limit;
        const endIndex   = page * limit;

        const paginatedInventory = allInventory.slice(startIndex, endIndex);

        return res.status(200).json({
            success:      true,
            currentPage:  page,
            totalPages:   Math.ceil(allInventory.length / limit),
            totalItems:   allInventory.length,
            itemsPerPage: limit,
            inventory:    paginatedInventory
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};