const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/adminController"); // WRONG, I need paymentController
const pCtrl = require("../controllers/paymentController");

/**
 * Routes for Stripe Payments and QR Code generation.
 * /api/payments/...
 */

// Generate Stripe Checkout Session URL
router.post("/create-checkout-session", pCtrl.createCheckoutSession.bind(pCtrl));

// Generate QR Code image for a subscription tier
// Usage: GET /qr/Premium?uid=USER_ID
router.get("/qr/:tier", pCtrl.getQRCode.bind(pCtrl));

module.exports = router;
