// config/posConfig.js
export const POS_CONFIG = {
    baseURL: "https://api.your-pos.com",
    headers: {
        "Authorization": `Bearer ${process.env.POS_API_KEY}`,
        "Content-Type": "application/json"
    }
}