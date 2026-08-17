import { Order } from "../Model/OrderModel.js";
import { Product } from "../Model/productModel.js"
import { StoreStats } from "../Model/StoreStats.js";
import { User } from "../Model/userModel.js"

export const OrderCreator = async (req, res) => {
    try {
        const userID = req.user ? req.user.id : null;
        let user = null;
        if (userID) {
            user = await User.findById(userID);
        }
        const {
            items,
            shippingAddress,
            paymentMethod,
            guestInfo
        } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items are required!"
            });
        }
        if (
            !shippingAddress?.street ||
            !shippingAddress?.city ||
            !shippingAddress?.province ||
            !shippingAddress?.postalCode ||
            !shippingAddress?.country
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a complete shipping address!"
            });
        }
        if (!user) {
            if (
                !guestInfo?.firstName ||
                !guestInfo?.lastName ||
                !guestInfo?.email ||
                !guestInfo?.phone
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Guest information is required."
                });
            }
        }
        let processedItems = [];
        let totalAmount = 0;
        let totalItems = 0;
        const deliverytime = new Date()
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid item structure"
                });
            }
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`
                });
            }
            if (
                product.stock !== undefined &&
                product.stock < item.quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }
            let finalPrice = product.price;
            const now = new Date();
            if (
                product.discount &&
                product.discount.isActive &&
                now >= new Date(product.discount.startDate) &&
                now <= new Date(product.discount.endDate)
            ) {
                if (product.discount.discountType === "percentage") {
                    finalPrice =
                        product.price -
                        (product.price * product.discount.value) / 100;
                } else if (product.discount.discountType === "fixed") {
                    finalPrice =
                        product.price - product.discount.value;
                }
            }
            deliverytime.setDate(deliverytime.getDate() + 4)
            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                price: finalPrice,
            });
            totalAmount += finalPrice * item.quantity;
            totalItems += item.quantity;
            product.stock -= item.quantity;
            await product.save();
        }
        const orderData = {
            items: processedItems,
            totalAmount,
            totalItems,
            shippingAddress,
            paymentMethod: paymentMethod || "Cash On Delivery",
            isGuestOrder: !user,
            estimatedDelivery: deliverytime
        };
        if (user) {
            orderData.user = user._id;
        } else {
            orderData.guestInfo = {
                firstName: guestInfo.firstName,
                lastName: guestInfo.lastName,
                email: guestInfo.email,
                phone: guestInfo.phone
            };
        }
        const order = await Order.create(orderData);
        if (user) {
            user.address = shippingAddress;
            await user.save();
        }
        await order.populate("items.product");
        return res.status(201).json({
            success: true,
            message: userID ? "Order Created Successfully!" : "Guest Order Created Successfully!",
            order
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const getOrders = async (req, res) => {
    try {
        const userID = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [my_orders, totalItems] = await Promise.all([
            Order.find({ user: userID }).populate("items.product").skip(skip).limit(limit).sort({ createdAt: -1 }),
            Order.countDocuments({ user: userID })
        ]);

        return res.status(200).json({
            success: true,
            message: "Orders Fetched Successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            itemsPerPage: limit,
            my_orders
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
export const getOrderById = async (req, res) => {
    try {
        const userID = req.user.id;
        const { id } = req.params;
        const order = await Order.findById(id).populate("items.product")
        if (!order) return res.status(404).json({ success: false, message: "Order Not Found!" })
        return res.status(200).json({ success: true, message: "Order Fetched Successfully!", order })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const getAllOrderForAdmin = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)   || 1;
        const limit = parseInt(req.query.limit)  || 10;
        const skip  = (page - 1) * limit;

        const [orders, totalItems] = await Promise.all([
            Order.find({ isArchived: false })
                .populate("items.product", "name price image category") 
                .populate("user", "firstname lastname email phno")      
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),        
            Order.countDocuments({ isArchived: false })
        ]);

        return res.status(200).json({
            success:      true,
            message:      "Orders Fetched Successfully!",
            currentPage:  page,
            totalPages:   Math.ceil(totalItems / limit),
            totalItems,
            itemsPerPage: limit,
            orders
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
export const UpdateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled"
        ];
        const allowedTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["shipped"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: []
        }
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order Not Found!" })
        if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid Status!" })
        if (!allowedTransitions[order.status].includes(status)) return res.status(400).json({ success: false, message: `Can't change the status ${order.status} to ${status}` })
        if (status === "cancelled" && order.status !== "cancelled") {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }
        if (status === "delivered" && order.status !== "delivered") {

            let stats = await StoreStats.findOne();

            if (!stats) {
                stats = await StoreStats.create({
                    totalRevenue: 0,
                    totalOrders: 0,
                    deliveredOrders: 0
                });
            }

            stats.totalRevenue += order.totalAmount;
            stats.deliveredOrders += 1;

            await stats.save();
            order.deliveredAt = new Date();
        }
        order.status = status;
        await order.save()
        return res.status(200).json({ success: true, message: "Order Status Updated Successfully!", order })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const ordercancelforuser = async (req, res) => {
    try {
        const userID = req.user.id;
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order Not Found!" })
        if (order.user.toString() !== userID) return res.status(401).json({ success: false, message: "You are not authorized for this Action!" })
        if (order.status === "delivered") return res.status(400).json({ success: false, message: "You can't cancel a delivered order!" })
        if (order.status === "shipped") return res.status(400).json({ success: false, message: "You can't cancel a shipped order!" })
        if (order.status === "cancelled") return res.status(400).json({ success: false, message: "You can't cancel a cancelled order!" })
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        order.status = "cancelled";
        await order.save()
        return res.status(200).json({ success: true, message: "Order Cancelled Successfully!", order })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const orderdeletionforAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order Not Found!" })
        order.isArchived = true;
        await order.save();
        return res.status(200).json({ success: true, message: "Order Deleted Successfully!", order })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const getArchiedOrders = async (req, res) => {
    try {
        const Archived = await Order.find({ isArchived: true })
        return res.status(200).json({ success: true, message: "Archied Orders Successfully!", Archived })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const getStatsStore = async (req, res) => {
    try {
        const StoreStates = await StoreStats.findOne()
        console.log(StoreStates)
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                    deliveredAt: { $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$deliveredAt" },
                        month: { $month: "$deliveredAt" }
                    },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        console.log(monthlyRevenue)
        if (!StoreStates) return res.status(404).json({ success: false, message: "No States Found!" })
        return res.status(200).json({ success: true, StoreStates, monthlyRevenue })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}