const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const QRCode = require('qrcode');
const { db } = require('../config/firebase');

/**
 * Controller to handle Stripe payments and QR code generation.
 */
class PaymentController {
  
  /**
   * Generates a Stripe Checkout Session.
   */
  async createCheckoutSession(req, res) {
    const { uid, tier } = req.body;
    
    try {
      const session = await this._createSession(uid, tier);
      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Stripe Session Error:", error.message);
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  /**
   * Generates a QR Code image pointing to a Stripe Checkout Session.
   * Returns a PNG image buffer.
   */
  async getQRCode(req, res) {
    const { tier } = req.params;
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({ error: "User UID is required as a query parameter" });
    }

    try {
      const session = await this._createSession(uid, tier);
      const qrBuffer = await QRCode.toBuffer(session.url, {
        margin: 2,
        width: 400,
        color: {
          dark: '#0f172a', // Matches our dark theme
          light: '#ffffff'
        }
      });

      res.type('png').send(qrBuffer);
    } catch (error) {
      console.error("QR Generation Error:", error.message);
      res.status(error.status || 500).json({ error: "Failed to generate payment QR code" });
    }
  }

  /**
   * Internal helper to create Stripe sessions.
   */
  async _createSession(uid, tier) {
    const prices = {
      'Basic': 441,    // $4.41 USD
      'Standard': 751, // $7.51 USD
      'Premium': 1061  // $10.61 USD
    };

    if (!prices[tier]) {
      const err = new Error("Invalid tier selected");
      err.status = 400;
      throw err;
    }

    return await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Pushplay ${tier} Subscription`,
            description: `30 days of ${tier} access to Pushplay TV`,
          },
          unit_amount: prices[tier],
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://pushplay.tv/payment/success',
      cancel_url: 'https://pushplay.tv/payment/cancel',
      client_reference_id: uid, // Links the payment to our Firebase user
      metadata: {
        tier: tier
      }
    });
  }

  /**
   * Handles Stripe Webhook events.
   * Updates user subscription status in Firestore.
   */
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Use raw body for signature verification
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Signature Verification Failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const uid = session.client_reference_id;
      const tier = session.metadata.tier;

      if (uid && tier) {
        try {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30-day subscription

          await db.collection('users').doc(uid).update({
            subscription_tier: tier,
            subscription_expiry: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
          });

          console.log(`Successfully updated subscription for user ${uid} to ${tier}`);
        } catch (dbErr) {
          console.error(`Database Update Failed for user ${uid}:`, dbErr.message);
          return res.status(500).json({ error: "Webhook received but database update failed" });
        }
      }
    }

    res.json({ received: true });
  }
}

module.exports = new PaymentController();
