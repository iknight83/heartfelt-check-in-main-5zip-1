import express from "express";
import crypto from "crypto";
import pg from "pg";
import PayPalSDK from "@paypal/paypal-server-sdk";

const { Client, Environment, LogLevel, OrdersController } = PayPalSDK;

const router = express.Router();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  console.error("Missing PAYPAL_CLIENT_ID — PayPal payments will not work");
}
if (!PAYPAL_CLIENT_SECRET) {
  console.error("Missing PAYPAL_CLIENT_SECRET — PayPal payments will not work");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

let ordersController: OrdersController | null = null;

if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CLIENT_ID,
      oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment:
      process.env.NODE_ENV === "production"
        ? Environment.Production
        : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });
  ordersController = new OrdersController(client);
}

const PLAN_PRICES: Record<string, string> = {
  monthly: "2.99",
  annual: "21.99",
  lifetime: "59.99",
};

const VALID_PLANS = ["monthly", "annual", "lifetime"] as const;
type PlanType = "monthly" | "annual" | "lifetime";

interface SubscriptionAccess {
  hasAccess: boolean;
  plan: string | null;
  status: "active" | "expired" | "none";
  expiresAt: Date | null;
  isLifetime: boolean;
}

interface TrialAccess {
  hasTrial: boolean;
  isTrialActive: boolean;
  trialStartedAt: Date | null;
  trialExpiresAt: Date | null;
}

const TRIAL_DURATION_DAYS = 7;

const getTrialAccess = async (userId: string): Promise<TrialAccess> => {
  try {
    const result = await pool.query(
      `SELECT * FROM trials WHERE user_id = $1`,
      [userId]
    );

    const now = new Date();

    if (result.rows.length === 0) {
      return {
        hasTrial: false,
        isTrialActive: false,
        trialStartedAt: null,
        trialExpiresAt: null,
      };
    }

    const trial = result.rows[0];
    const expiresAt = new Date(trial.expires_at);
    const isActive = expiresAt > now;

    if (!isActive && trial.is_active) {
      await pool.query(
        `UPDATE trials SET is_active = false WHERE user_id = $1`,
        [userId]
      );
    }

    return {
      hasTrial: true,
      isTrialActive: isActive,
      trialStartedAt: trial.started_at,
      trialExpiresAt: trial.expires_at,
    };
  } catch (error) {
    console.error("Error checking trial access:", error);
    return {
      hasTrial: false,
      isTrialActive: false,
      trialStartedAt: null,
      trialExpiresAt: null,
    };
  }
};

const startTrial = async (userId: string): Promise<TrialAccess> => {
  try {
    const existing = await pool.query(
      `SELECT * FROM trials WHERE user_id = $1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      return getTrialAccess(userId);
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS);
    
    await pool.query(
      `INSERT INTO trials (user_id, started_at, expires_at, is_active) 
       VALUES ($1, $2, $3, true)`,
      [userId, now, expiresAt]
    );

    return {
      hasTrial: true,
      isTrialActive: true,
      trialStartedAt: now,
      trialExpiresAt: expiresAt,
    };
  } catch (error) {
    console.error("Error starting trial:", error);
    return {
      hasTrial: false,
      isTrialActive: false,
      trialStartedAt: null,
      trialExpiresAt: null,
    };
  }
};

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

router.get("/client-id", (_req, res) => {
  if (!PAYPAL_CLIENT_ID) {
    return res.status(500).json({ error: "PayPal not configured" });
  }
  return res.json({ clientId: PAYPAL_CLIENT_ID });
});

router.post("/create-order", async (req, res) => {
  console.log("=== PAYPAL CREATE ORDER (JS SDK) ===");
  try {
    if (!ordersController || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({
        error: "PayPal credentials not configured",
        message: "Payment system is not properly configured."
      });
    }

    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: "userId and plan are required" });
    }

    if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const amount = PLAN_PRICES[plan];
    if (!amount) {
      return res.status(400).json({ error: "Invalid plan configuration" });
    }

    const reference = generateReference();

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
      [reference, userId, plan, parseFloat(amount), "pending", false]
    );

    const collect = {
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            referenceId: reference,
            amount: {
              currencyCode: "USD",
              value: amount,
            },
            description: `STATE App - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            customId: JSON.stringify({ userId, plan, reference }),
          },
        ],
      },
    };

    const { body } = await ordersController.createOrder(collect);
    const orderData = JSON.parse(String(body));

    console.log("PayPal order created (JS SDK):", orderData.id);

    await pool.query(
      `UPDATE payments SET transaction_reference = $1 WHERE transaction_reference = $2`,
      [orderData.id, reference]
    );

    return res.json({ orderId: orderData.id });
  } catch (error) {
    console.error("PayPal create-order error:", error);
    return res.status(500).json({
      error: "Failed to create order",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/capture-order", async (req, res) => {
  console.log("=== PAYPAL CAPTURE ORDER (JS SDK) ===");
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    if (!ordersController) {
      return res.status(500).json({ success: false, message: "Payment system not configured" });
    }

    const { body } = await ordersController.captureOrder({ id: orderId });
    const captureData = JSON.parse(String(body));

    console.log("PayPal capture response:", captureData.status);

    if (captureData.status === "COMPLETED") {
      const purchaseUnit = captureData.purchaseUnits?.[0];
      let userId: string | null = null;
      let plan: PlanType | null = null;

      if (purchaseUnit?.payments?.captures?.[0]?.customId) {
        try {
          const customData = JSON.parse(purchaseUnit.payments.captures[0].customId);
          userId = customData.userId;
          plan = customData.plan;
        } catch {}
      }

      if (!userId && purchaseUnit?.customId) {
        try {
          const customData = JSON.parse(purchaseUnit.customId);
          userId = customData.userId;
          plan = customData.plan;
        } catch {}
      }

      if (!userId) {
        const paymentResult = await pool.query(
          `SELECT user_id, plan FROM payments WHERE transaction_reference = $1`,
          [orderId]
        );
        if (paymentResult.rows.length > 0) {
          userId = paymentResult.rows[0].user_id;
          plan = paymentResult.rows[0].plan;
        }
      }

      await pool.query(
        `UPDATE payments 
         SET status = 'complete', verified_at = NOW(), updated_at = NOW()
         WHERE transaction_reference = $1`,
        [orderId]
      );

      const paymentResult = await pool.query(
        `SELECT id FROM payments WHERE transaction_reference = $1`,
        [orderId]
      );

      if (paymentResult.rows.length > 0 && userId && plan && VALID_PLANS.includes(plan)) {
        const paymentId = paymentResult.rows[0].id;
        await activateSubscription(userId, plan, paymentId);
      }

      return res.json({
        success: true,
        status: "success",
        userId,
        plan,
        message: "Payment completed and subscription activated"
      });
    }

    return res.json({
      success: false,
      status: captureData.status || "unknown",
      message: "Payment not completed"
    });
  } catch (error: any) {
    if (error?.statusCode === 422 && ordersController) {
      try {
        const { body } = await ordersController.getOrder({ id: req.body.orderId });
        const orderData = JSON.parse(String(body));
        if (orderData.status === "COMPLETED") {
          const paymentResult = await pool.query(
            `SELECT user_id, plan FROM payments WHERE transaction_reference = $1 AND status = 'complete'`,
            [req.body.orderId]
          );
          if (paymentResult.rows.length > 0) {
            return res.json({
              success: true,
              status: "success",
              userId: paymentResult.rows[0].user_id,
              plan: paymentResult.rows[0].plan,
              message: "Payment already completed"
            });
          }
        }
      } catch {}
    }
    console.error("PayPal capture-order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to capture payment"
    });
  }
});

router.post("/initiate", async (req, res) => {
  console.log("=== PAYPAL INITIATE ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  try {
    if (!ordersController || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error("ERROR: Missing PayPal credentials!");
      return res.status(500).json({
        error: "PayPal credentials not configured",
        message: "Payment system is not properly configured. Please contact support."
      });
    }

    const { userId, plan } = req.body;

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

    const baseUrl = process.env.REPLIT_DEPLOYMENT_URL 
      ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
      : process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:5000";

    const returnUrl = `${baseUrl}/payment/success?ref=${reference}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    console.log("Base URL:", baseUrl);
    console.log("Return URL:", returnUrl);
    console.log("Reference:", reference);
    console.log("User ID:", userId);
    console.log("Amount (USD):", amount);

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
      [reference, userId, plan, parseFloat(amount), "pending", false]
    );

    const collect = {
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            referenceId: reference,
            amount: {
              currencyCode: "USD",
              value: amount,
            },
            description: `STATE App - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            customId: JSON.stringify({ userId, plan, reference }),
          },
        ],
        paymentSource: {
          paypal: {
            experienceContext: {
              returnUrl: returnUrl,
              cancelUrl: cancelUrl,
              brandName: "STATE",
              userAction: "PAY_NOW",
              landingPage: "LOGIN",
            },
          },
        },
      },
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const orderData = JSON.parse(String(body));

    console.log("PayPal order created:", JSON.stringify(orderData, null, 2));

    const approveLink = orderData.links?.find((link: any) => link.rel === "payer-action");

    if (!approveLink) {
      console.error("No approval URL in PayPal response");
      return res.status(500).json({
        error: "Payment initialization failed",
        message: "Could not get PayPal checkout URL"
      });
    }

    await pool.query(
      `UPDATE payments SET transaction_reference = $1 WHERE transaction_reference = $2`,
      [orderData.id, reference]
    );

    console.log("=== PAYPAL REDIRECT ===");
    console.log("Approval URL:", approveLink.href);

    return res.json({
      status: "ok",
      authorizationUrl: approveLink.href,
      reference: orderData.id,
      orderId: orderData.id,
    });
  } catch (error) {
    console.error("PayPal initiate error:", error);
    return res.status(500).json({
      error: "Failed to initiate payment",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

    if (!ordersController) {
      return res.status(500).json({
        success: false,
        message: "Payment system not configured"
      });
    }

    console.log("=== PAYPAL VERIFY/CAPTURE ===");
    console.log("Order ID:", reference);

    try {
      const { body } = await ordersController.captureOrder({ id: reference });
      const captureData = JSON.parse(String(body));

      console.log("PayPal capture response:", JSON.stringify(captureData, null, 2));

      if (captureData.status === "COMPLETED") {
        const purchaseUnit = captureData.purchaseUnits?.[0];
        let userId: string | null = null;
        let plan: PlanType | null = null;

        if (purchaseUnit?.payments?.captures?.[0]?.customId) {
          try {
            const customData = JSON.parse(purchaseUnit.payments.captures[0].customId);
            userId = customData.userId;
            plan = customData.plan;
          } catch {}
        }

        if (!userId && purchaseUnit?.customId) {
          try {
            const customData = JSON.parse(purchaseUnit.customId);
            userId = customData.userId;
            plan = customData.plan;
          } catch {}
        }

        if (!userId) {
          const paymentResult = await pool.query(
            `SELECT user_id, plan FROM payments WHERE transaction_reference = $1`,
            [reference]
          );
          if (paymentResult.rows.length > 0) {
            userId = paymentResult.rows[0].user_id;
            plan = paymentResult.rows[0].plan;
          }
        }

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

        if (paymentResult.rows.length > 0 && userId && plan && VALID_PLANS.includes(plan)) {
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

      if (captureData.status === "APPROVED") {
        return res.json({
          success: false,
          status: "pending",
          message: "Payment approved but not yet captured"
        });
      }

      return res.json({
        success: false,
        status: captureData.status || "unknown",
        message: "Payment not completed"
      });
    } catch (captureError: any) {
      if (captureError?.statusCode === 422) {
        const { body } = await ordersController.getOrder({ id: reference });
        const orderData = JSON.parse(String(body));

        if (orderData.status === "COMPLETED") {
          const paymentResult = await pool.query(
            `SELECT user_id, plan FROM payments WHERE transaction_reference = $1 AND status = 'complete'`,
            [reference]
          );

          if (paymentResult.rows.length > 0) {
            return res.json({
              success: true,
              status: "success",
              userId: paymentResult.rows[0].user_id,
              plan: paymentResult.rows[0].plan,
              message: "Payment already completed"
            });
          }
        }
      }

      throw captureError;
    }
  } catch (error) {
    console.error("PayPal verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
});

router.get("/subscription/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [access, trialAccess] = await Promise.all([
      getUserSubscriptionAccess(userId),
      getTrialAccess(userId),
    ]);

    const hasActiveAccess = access.hasAccess || trialAccess.isTrialActive;
    
    const isPaid = access.hasAccess && access.plan !== null;
    const isPro = isPaid;
    
    const planType = trialAccess.isTrialActive && !isPaid 
      ? "trial" 
      : access.plan;

    return res.json({
      hasSubscription: access.hasAccess,
      hasTrial: trialAccess.hasTrial,
      isTrialActive: trialAccess.isTrialActive,
      hasActiveAccess,
      plan: access.plan,
      plan_type: planType,
      is_paid: isPaid,
      is_pro: isPro,
      status: access.status,
      expiresAt: access.expiresAt,
      expires_at: access.expiresAt,
      isLifetime: access.isLifetime,
      trialStartedAt: trialAccess.trialStartedAt,
      trialExpiresAt: trialAccess.trialExpiresAt,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      hasSubscription: false,
      hasTrial: false,
      isTrialActive: false,
      hasActiveAccess: false,
      plan_type: null,
      is_paid: false,
      is_pro: false,
      status: "none",
      message: "Failed to check subscription"
    });
  }
});

router.post("/trial/start", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const trialAccess = await startTrial(userId);

    return res.json({
      success: true,
      hasTrial: trialAccess.hasTrial,
      isTrialActive: trialAccess.isTrialActive,
      trialStartedAt: trialAccess.trialStartedAt,
      trialExpiresAt: trialAccess.trialExpiresAt,
    });
  } catch (error) {
    console.error("Start trial error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start trial"
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
