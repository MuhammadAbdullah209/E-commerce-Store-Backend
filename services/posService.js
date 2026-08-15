import axios from "axios";

const posClient = axios.create({
    baseURL: `https://${process.env.LIGHTSPEED_DOMAIN}.retail.lightspeed.app/api/2026-07`,
    headers: {
        "Authorization": `Bearer ${process.env.LIGHTSPEED_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
    }
});

export const getPOSProducts = async ({ page_size, after, before, deleted, sku, name, include_images }) => {
    const response = await posClient.get("/products", {
        params: {
            page_size,
            after,
            before,
            deleted,
            sku,
            name,
            include_images
        }
    });
    return response.data;
};

export const getPOSProductById = async (id) => {
    const response = await posClient.get(`/products/${id}`);
    return response.data;
};

export const getPOSCategories = async ({ page_size, after, before }) => {
    const response = await posClient.get("/product_categories", {
        params: { page_size, after, before }
    });
    return response.data;
};

export const getPOSInventory = async ({ page_size, after, before }) => {
    const response = await posClient.get("/inventory", {
        params: { page_size, after, before }
    });
    return response.data;
};