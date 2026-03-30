const express = require("express");
const cors = require("cors");
const { admin, auth, db } = require("./src/config/firebase");
require("dotenv").config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Update trust proxy settings for correct IP detection if behind a proxy
app.set('trust proxy', true);

// Enable CORS for all routes (Standard for API dev)
app.use(cors());

// Body parser middleware
// Stripe Webhook: Needs raw body BEFORE express.json()
const paymentController = require("./src/controllers/paymentController");
app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), (req, res) => {
  paymentController.handleWebhook(req, res);
});

app.use(express.json());

const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");

// Base API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/admin", adminRoutes);

// Root route for health check
app.get("/", (req, res) => {
  res.json({ status: "healthy", message: "Pushplay API is running." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandleed Error:", err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
