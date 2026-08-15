import express from "express"
import { getAllOrderForAdmin, getArchiedOrders, getOrderById, getOrders, getStatsStore, ordercancelforuser, OrderCreator, orderdeletionforAdmin, UpdateOrderStatus } from "../Controllers/OrderController.js"
import { GuestProtection, isAdmin, isUser, protection } from "../Middleware/Middleware.js"
import { Admin } from "mongodb"
const orderrouter = express.Router()
/**
 * @swagger
 * /Order/create:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a new order (User only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *             properties:
 *               items:
 *                 type: array
 *                 example:
 *                   - productId: "64f1c2a1b2c3d4e5f6789012"
 *                     quantity: 2
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 example: "Cash On Delivery"
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 */
orderrouter.post("/create", GuestProtection, OrderCreator)
/**
 * @swagger
 * /Order:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get logged-in user orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 */
orderrouter.get("/", protection, getOrders)
/**
 * @swagger
 * /Order/admin:
 *   get:
 *     tags:
 *       - Orders (Admin)
 *     summary: Get all orders (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
orderrouter.get("/admin", protection, getAllOrderForAdmin)
/**
 * @swagger
 * /Order/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *       404:
 *         description: Order not found
 */
orderrouter.get("/:id", protection, getOrderById)
/**
 * @swagger
 * /Order/admin/orders/{id}/status:
 *   put:
 *     tags:
 *       - Orders (Admin)
 *     summary: Update order status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "shipped"
 *                 enum:
 *                   - pending
 *                   - confirmed
 *                   - shipped
 *                   - delivered
 *                   - cancelled
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status or transition
 *       404:
 *         description: Order not found
 */
orderrouter.put("/admin/orders/:id/status", protection, isAdmin, UpdateOrderStatus)
/**
 * @swagger
 * /Order/{id}:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Cancel order (User only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
orderrouter.put("/:id", protection, isUser, ordercancelforuser)
/**
 * @swagger
 * /Order/admin/orders/{id}:
 *   delete:
 *     tags:
 *       - Orders (Admin)
 *     summary: Delete order (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
orderrouter.delete("/admin/orders/:id", protection, isAdmin, orderdeletionforAdmin)
orderrouter.get("/admin/ArchevedOrders", protection, isAdmin, getArchiedOrders)
orderrouter.get("/Admin/Store", protection, isAdmin, getStatsStore)
export default orderrouter