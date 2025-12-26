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
type PlanType = "monthly" | "annual" | "lifetime";

interface InitiatePaymentRequest {
  userId?: string;
  plan: PlanType;
  email?: string;
  isAnonymous?: boolean;
}

interface SubscriptionAccess {
  hasAccess: boolean;
  plan: string | null;
  status: "active" | "expired" | "none";
  expiresAt: Date | null;
  isLifetime: boolean;
}

const generateReference = (): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HFCHK-${timestamp}-${random}`;
};

const calculateExpiryDate = (plan: PlanType, startDate: Date = new Date()): Date | null => {
  if (plan === "lifetime") {
    return null;
  }
  
  const expiryDate = new Date(startDate);
  
  if (plan === "annual") {
    expiryDate.setDate(expiryDate.getDate() + 365);
  } else if (plan === "monthly") {
    expiryDate.setDate(expiryDate.getDate() + 30);
  }
  
  return expiryDate;
};

const getUserSubscriptionAccess = async (userId: string): Promise<SubscriptionAccess> => {
  try {
    const result = await pool.query(
      `SELECT * FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        hasAccess: false,
        plan: null,
        status: "none",
        expiresAt: null,
        isLifetime: false,
      };
    }

    const subscription = result.rows[0];
    const now = new Date();

    if (subscription.plan === "lifetime") {
      if (!subscription.is_active) {
        await pool.query(
          `UPDATE subscriptions SET is_active = true, updated_at = NOW() WHERE user_id = $1`,
          [userId]
        );
      }
      return {
        hasAccess: true,
        plan: subscription.plan,
        status: "active",
        expiresAt: null,
        isLifetime: true,
      };
    }

    if (subscription.expires_at && new Date(subscription.expires_at) > now) {
      if (!subscription.is_active) {
        await pool.query(
          `UPDATE subscriptions SET is_active = true, updated_at = NOW() WHERE user_id = $1`,
          [userId]
        );
      }
      return {
        hasAccess: true,
        plan: subscription.plan,
        status: "active",
        expiresAt: subscription.expires_at,
        isLifetime: false,
      };
    }

    if (subscription.is_active) {
      await pool.query(
        `UPDATE subscriptions SET is_active = false, updated_at = NOW() WHERE user_id = $1`,
        [userId]
      );
    }

    return {
      hasAccess: false,
      plan: subscription.plan,
      status: "expired",
      expiresAt: subscription.expires_at,
      isLifetime: false,
    };
  } catch (error) {
    console.error("Error checking subscription access:", error);
    return {
      hasAccess: false,
      plan: null,
      status: "none",
      expiresAt: null,
      isLifetime: false,
    };
  }
};

const activateSubscription = async (userId: string, plan: PlanType, paymentId: number): Promise<void> => {
  const now = new Date();
  const expiresAt = calculateExpiryDate(plan, now);

  console.log(`=== ACTIVATING SUBSCRIPTION ===`);
  console.log(`User: ${userId}`);
  console.log(`Plan: ${plan}`);
  console.log(`Started: ${now.toISOString()}`);
  console.log(`Expires: ${expiresAt ? expiresAt.toISOString() : "NEVER (lifetime)"}`);

  await pool.query(
    `INSERT INTO subscriptions (user_id, plan, is_active, activated_at, expires_at, payment_id)
     VALUES ($1, $2, true, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       plan = EXCLUDED.plan,
       is_active = true,
       activated_at = EXCLUDED.activated_at,
       expires_at = EXCLUDED.expires_at,
       payment_id = EXCLUDED.payment_id,
       updated_at = NOW()`,
    [userId, plan, now, expiresAt, paymentId]
  );

  console.log(`=== SUBSCRIPTION ACTIVATED SUCCESSFULLY ===`);
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

    const { userId, plan, email, isAnonymous } = req.body as InitiatePaymentRequest;

    if (!plan) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "plan is required"
      });
    }

    const effectiveUserId = userId || `anon_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

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
    const customerEmail = email || `${effectiveUserId}@heartfelt-temp.com`;
    const isAnonymousPayment = isAnonymous || !userId || effectiveUserId.startsWith("anon_");

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
    console.log("Is Anonymous Payment:", isAnonymousPayment);

    await pool.query(
      `INSERT INTO payments (transaction_reference, user_id, plan, amount, status, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (transaction_reference) 
       DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         plan = EXCLUDED.plan,
         amount = EXCLUDED.amount,
         is_anonymous = EXCLUDED.is_anonymous,
         updated_at = NOW()
       RETURNING id`,
      [reference, effectiveUserId, plan, amount / 100, "pending", isAnonymousPayment]
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
          userId: effectiveUserId,
          plan,
          isAnonymous: isAnonymousPayment,
          custom_fields: [
            {
              display_name: "Plan",
              variable_name: "plan",
              value: plan
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: effectiveUserId
            },
            {
              display_name: "Anonymous",
              variable_name: "is_anonymous",
              value: isAnonymousPayment ? "Yes" : "No"
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
      userId: effectiveUserId,
      isAnonymous: isAnonymousPayment,
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

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("SECURITY: Invalid Paystack signature");
      return res.sendStatus(400);
    }

    console.log("Signature verified successfully");

    const payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    
    console.log("Event:", payload.event);
    console.log("Data:", JSON.stringify(payload.data, null, 2));

    const { event, data } = payload;

    if (event === "charge.success") {
      const { reference, amount, metadata } = data;
      const userId = metadata?.userId;
      const plan = metadata?.plan as PlanType;

      console.log(`Processing successful charge for reference: ${reference}`);

      const paymentResult = await pool.query(
        `SELECT * FROM payments WHERE transaction_reference = $1`,
        [reference]
      );

      let paymentId: number;

      if (paymentResult.rows.length === 0) {
        console.log("Payment not found in database, creating new record");
        const insertResult = await pool.query(
          `INSERT INTO payments (transaction_reference, user_id, plan, amount, status, verified_at)
           VALUES ($1, $2, $3, $4, 'complete', NOW())
           RETURNING id`,
          [reference, userId || "unknown", plan || "unknown", amount / 100]
        );
        paymentId = insertResult.rows[0].id;
      } else {
        await pool.query(
          `UPDATE payments 
           SET status = 'complete', verified_at = NOW(), updated_at = NOW()
           WHERE transaction_reference = $1`,
          [reference]
        );
        paymentId = paymentResult.rows[0].id;
      }

      if (userId && userId !== "unknown" && plan && VALID_PLANS.includes(plan)) {
        await activateSubscription(userId, plan, paymentId);
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
      const plan = metadata?.plan as PlanType;

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

      if (paymentResult.rows.length > 0 && userId && userId !== "unknown" && plan && VALID_PLANS.includes(plan)) {
        const paymentId = paymentResult.rows[0].id;
        await activateSubscription(userId, plan, paymentId);
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
    const access = await getUserSubscriptionAccess(userId);

    return res.json({
      hasSubscription: access.hasAccess,
      plan: access.plan,
      status: access.status,
      expiresAt: access.expiresAt,
      isLifetime: access.isLifetime,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      hasSubscription: false,
      status: "none",
      message: "Failed to check subscription"
    });
  }
});

router.post("/claim", async (req, res) => {
  try {
    const { reference, newUserId } = req.body;

    if (!reference || !newUserId) {
      return res.status(400).json({
        success: false,
        message: "reference and newUserId are required"
      });
    }

    console.log(`=== CLAIMING SUBSCRIPTION ===`);
    console.log(`Reference: ${reference}`);
    console.log(`New User ID: ${newUserId}`);

    const paymentResult = await pool.query(
      `SELECT * FROM payments WHERE transaction_reference = $1 AND status = 'complete'`,
      [reference]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No completed payment found with this reference"
      });
    }

    const payment = paymentResult.rows[0];
    const plan = payment.plan as PlanType;

    // Prevent double-claiming: only allow claiming if payment is still anonymous
    if (!payment.is_anonymous) {
      console.log(`Payment already claimed by user: ${payment.user_id}`);
      
      // If already claimed by this same user, return success (idempotent)
      if (payment.user_id === newUserId) {
        return res.json({
          success: true,
          plan,
          message: "Subscription already claimed by this user"
        });
      }
      
      return res.status(400).json({
        success: false,
        message: "This payment has already been claimed"
      });
    }

    await pool.query(
      `UPDATE payments SET user_id = $1, is_anonymous = false, updated_at = NOW() 
       WHERE transaction_reference = $2`,
      [newUserId, reference]
    );

    await activateSubscription(newUserId, plan, payment.id);

    console.log(`=== SUBSCRIPTION CLAIMED SUCCESSFULLY ===`);

    return res.json({
      success: true,
      plan,
      message: "Subscription claimed successfully"
    });
  } catch (error) {
    console.error("Claim subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to claim subscription"
    });
  }
});

router.get("/access/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const access = await getUserSubscriptionAccess(userId);

    if (!access.hasAccess) {
      return res.status(403).json({
        hasAccess: false,
        status: access.status,
        message: access.status === "expired" 
          ? "Your subscription has expired. Renew to unlock deeper insights."
          : "Subscription required to access deeper insights"
      });
    }

    return res.json({
      hasAccess: true,
      plan: access.plan,
      status: access.status,
      expiresAt: access.expiresAt,
      isLifetime: access.isLifetime,
    });
  } catch (error) {
    console.error("Check access error:", error);
    return res.status(500).json({
      hasAccess: false,
      message: "Failed to check access"
    });
  }
});

export default router;
