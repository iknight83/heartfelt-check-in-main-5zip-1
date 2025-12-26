import express from "express";
import crypto from "crypto";
import pg from "pg";

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const PLAN_PRICES: Record<string, number> = {
  monthly: 4900,
  annual: 34900,
  lifetime: 99900,
};

const VALID_PLANS = ["monthly", "annual", "lifetime"] as const;

interface InitiatePaymentRequest {
  userId: string;
  plan: "monthly" | "annual" | "lifetime";
  email?: string;
}

const generateReference = (): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HFCHK-${timestamp}-${random}`;
};

router.post("/initiate", async (req, res) => {
  console.log("=== PAYSTACK INITIATE ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("PAYSTACK_SECRET_KEY configured:", !!PAYSTACK_SECRET_KEY);
  
  try {
    if (!PAYSTACK_SECRET_KEY) {
      console.error("ERROR: Missing Paystack secret key!");
      return res.status(500).json({
        error: "Paystack credentials not configured",
        message: "Payment system is not properly configured. Please contact support."
      });
    }

    const { userId, plan, email } = req.body as InitiatePaymentRequest;

    if (!userId || !plan) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "userId and plan are required"
      });
    }

    if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
      return res.status(400).json({
        error: "Invalid plan",
        message: "Plan must be one of: monthly, annual, lifetime"
      });
    }

    const amount = PLAN_PRICES[plan];
    if (!amount) {
      return res.status(400).json({
        error: "Invalid plan configuration",
        message: "Could not determine price for the selected plan"
      });
    }

    const reference = generateReference();
    const customerEmail = email || `${userId}@heartfelt-temp.com`;

    const baseUrl = process.env.REPLIT_DEPLOYMENT_URL 
      ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
      : process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:5000";

    const callbackUrl = `${baseUrl}/payment/success?ref=${reference}`;

    console.log("Base URL:", baseUrl);
    console.log("Callback URL:", callbackUrl);
    console.log("Reference:", reference);
    console.log("Amount (kobo):", amount);

    await pool.query(
      `INSERT INTO payments (transaction_reference, user_id, plan, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (transaction_reference) 
       DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         plan = EXCLUDED.plan,
         amount = EXCLUDED.amount,
         updated_at = NOW()
       RETURNING id`,
      [reference, userId, plan, amount / 100, "pending"]
    );

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amount,
        reference: reference,
        callback_url: callbackUrl,
        metadata: {
          userId,
          plan,
          custom_fields: [
            {
              display_name: "Plan",
              variable_name: "plan",
              value: plan
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId
            }
          ]
        }
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack API response:", JSON.stringify(paystackData, null, 2));

    if (!paystackData.status) {
      console.error("Paystack initialization failed:", paystackData.message);
      return res.status(400).json({
        error: "Payment initialization failed",
        message: paystackData.message || "Could not initialize payment"
      });
    }

    console.log("=== PAYSTACK REDIRECT ===");
    console.log("Authorization URL:", paystackData.data.authorization_url);

    return res.json({
      status: "ok",
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      accessCode: paystackData.data.access_code,
    });
  } catch (error) {
    console.error("Paystack initiate error:", error);
    return res.status(500).json({
      error: "Failed to initiate payment",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/webhook", async (req, res) => {
  console.log("=== PAYSTACK WEBHOOK RECEIVED ===");
  
  try {
    const signature = req.headers["x-paystack-signature"] as string;
    
    if (!signature) {
      console.error("SECURITY: Missing Paystack signature");
      return res.sendStatus(400);
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error("SECURITY: Paystack secret key not configured");
      return res.sendStatus(500);
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      console.error("SECURITY: Invalid Paystack signature");
      return res.sendStatus(400);
    }

    console.log("Signature verified successfully");
    console.log("Event:", req.body.event);
    console.log("Data:", JSON.stringify(req.body.data, null, 2));

    const { event, data } = req.body;

    if (event === "charge.success") {
      const { reference, amount, metadata } = data;
      const userId = metadata?.userId;
      const plan = metadata?.plan;

      console.log(`Processing successful charge for reference: ${reference}`);

      const paymentResult = await pool.query(
        `SELECT * FROM payments WHERE transaction_reference = $1`,
        [reference]
      );

      if (paymentResult.rows.length === 0) {
        console.log("Payment not found in database, creating new record");
        await pool.query(
          `INSERT INTO payments (transaction_reference, user_id, plan, amount, status, verified_at)
           VALUES ($1, $2, $3, $4, 'complete', NOW())`,
          [reference, userId || "unknown", plan || "unknown", amount / 100]
        );
      } else {
        await pool.query(
          `UPDATE payments 
           SET status = 'complete', verified_at = NOW(), updated_at = NOW()
           WHERE transaction_reference = $1`,
          [reference]
        );
      }

      const updatedPayment = await pool.query(
        `SELECT id, user_id, plan FROM payments WHERE transaction_reference = $1`,
        [reference]
      );

      if (updatedPayment.rows.length > 0) {
        const payment = updatedPayment.rows[0];
        
        if (payment.user_id && payment.user_id !== "unknown") {
          await pool.query(
            `INSERT INTO subscriptions (user_id, plan, is_active, activated_at, payment_id)
             VALUES ($1, $2, true, NOW(), $3)
             ON CONFLICT (user_id) DO UPDATE SET
               plan = EXCLUDED.plan,
               is_active = true,
               activated_at = NOW(),
               payment_id = EXCLUDED.payment_id,
               updated_at = NOW()`,
            [payment.user_id, payment.plan, payment.id]
          );

          console.log("=== SUBSCRIPTION ACTIVATED ===");
          console.log(`User: ${payment.user_id}, Plan: ${payment.plan}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.sendStatus(500);
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Reference is required"
      });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Payment system not configured"
      });
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log("Paystack verify response:", JSON.stringify(verifyData, null, 2));

    if (verifyData.status && verifyData.data.status === "success") {
      const { metadata } = verifyData.data;
      const userId = metadata?.userId;
      const plan = metadata?.plan;

      await pool.query(
        `UPDATE payments 
         SET status = 'complete', verified_at = NOW(), updated_at = NOW()
         WHERE transaction_reference = $1`,
        [reference]
      );

      const paymentResult = await pool.query(
        `SELECT id FROM payments WHERE transaction_reference = $1`,
        [reference]
      );

      if (paymentResult.rows.length > 0 && userId && userId !== "unknown") {
        const paymentId = paymentResult.rows[0].id;
        
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan, is_active, activated_at, payment_id)
           VALUES ($1, $2, true, NOW(), $3)
           ON CONFLICT (user_id) DO UPDATE SET
             plan = EXCLUDED.plan,
             is_active = true,
             activated_at = NOW(),
             payment_id = EXCLUDED.payment_id,
             updated_at = NOW()`,
          [userId, plan, paymentId]
        );

        console.log("=== SUBSCRIPTION ACTIVATED (via verify) ===");
        console.log(`User: ${userId}, Plan: ${plan}`);
      }

      return res.json({
        success: true,
        status: "success",
        userId,
        plan,
        message: "Payment verified and subscription activated"
      });
    }

    return res.json({
      success: false,
      status: verifyData.data?.status || "unknown",
      message: verifyData.message || "Payment not successful"
    });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
});

router.get("/subscription/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT s.*, p.plan as payment_plan, p.amount 
       FROM subscriptions s 
       LEFT JOIN payments p ON s.payment_id = p.id
       WHERE s.user_id = $1 AND s.is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        hasSubscription: false,
      });
    }

    const subscription = result.rows[0];

    return res.json({
      hasSubscription: true,
      plan: subscription.plan,
      activatedAt: subscription.activated_at,
      expiresAt: subscription.expires_at,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      hasSubscription: false,
      message: "Failed to check subscription"
    });
  }
});

export default router;
