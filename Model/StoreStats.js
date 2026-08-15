import mongoose from "mongoose";

const StoreStatsSchema = new mongoose.Schema({

    totalRevenue: {
        type: Number,
        default: 0
    },

    deliveredOrders: {
        type: Number,
        default: 0
    },

    totalOrders: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

export const StoreStats = mongoose.model(
    "StoreStats",
    StoreStatsSchema
);