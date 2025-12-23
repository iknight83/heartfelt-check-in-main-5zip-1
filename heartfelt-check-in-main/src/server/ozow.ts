import express from "express";
import crypto from "crypto";
import pg from "pg";

const router = express.Router();

const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || "";
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || "";
const OZOW_API_KEY = process.env.OZOW_API_KEY || "";
const IS_TEST = process.env.NODE_ENV !== "production";

const OZOW_PAY_URL = "https://pay.ozow.com";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

interface InitiatePaymentRequest {
  userId: string;
  plan: "monthly" | "annual" | "lifetime";
}

const generateTransactionReference = (): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HFCHK-${timestamp}-${random}`;
};

const PLAN_PRICES: Record<string, number> = {
  monthly: 49,
  annual: 349,
  lifetime: 999,
};

const VALID_PLANS = ["monthly", "annual", "lifetime"] as const;

const generateHash = (params: {
  siteCode: string;
  countryCode: string;
  currencyCode: string;
  amount: string;
  transactionReference: string;
  bankReference: string;
  cancelUrl: string;
  errorUrl: string;
  successUrl: string;
  notifyUrl: string;
  isTest: string;
  privateKey: string;
}): string => {
  const inputString = [
    params.siteCode,
    params.countryCode,
    params.currencyCode,
    params.amount,
    params.transactionReference,
    params.bankReference,
    params.cancelUrl,
    params.errorUrl,
    params.successUrl,
    params.notifyUrl,
    params.isTest,
    params.privateKey,
  ].join("").toLowerCase();

  return crypto.createHash("sha512").update(inputString).digest("hex");
};

const verifyOzowNotificationHash = (params: {
  siteCode: string;
  transactionId: string;
  transactionReference: string;
  amount: string;
  status: string;
  currencyCode: string;
  isTest: string;
  statusMessage: string;
  privateKey: string;
  receivedHash: string;
}): boolean => {
  const inputString = [
    params.siteCode,
    params.transactionId,
    params.transactionReference,
    params.amount,
    params.status,
    params.currencyCode,
    params.isTest,
    params.statusMessage,
    params.privateKey,
  ].join("").toLowerCase();

  const calculatedHash = crypto.createHash("sha512").update(inputString).digest("hex").toLowerCase();
  return calculatedHash === params.receivedHash.toLowerCase();
};

router.post("/initiate", async (req, res) => {
  console.log("=== OZOW INITIATE CALLED ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Environment check:");
  console.log("  - OZOW_SITE_CODE:", OZOW_SITE_CODE ? "configured" : "MISSING");
  console.log("  - OZOW_PRIVATE_KEY:", OZOW_PRIVATE_KEY ? "configured" : "MISSING");
  console.log("  - OZOW_API_KEY:", OZOW_API_KEY ? "configured" : "MISSING");
  console.log("  - IS_TEST mode:", IS_TEST);
  console.log("  - REPLIT_DEV_DOMAIN:", process.env.REPLIT_DEV_DOMAIN || "not set");
  console.log("  - REPLIT_DEPLOYMENT_URL:", process.env.REPLIT_DEPLOYMENT_URL || "not set");
  
  try {
    if (!OZOW_SITE_CODE || !OZOW_PRIVATE_KEY) {
      console.error("ERROR: Missing Ozow credentials!");
      console.error("OZOW_SITE_CODE:", OZOW_SITE_CODE ? "SET" : "MISSING");
      console.error("OZOW_PRIVATE_KEY:", OZOW_PRIVATE_KEY ? "SET" : "MISSING");
      return res.status(500).json({
        error: "Ozow credentials not configured",
        message: "Payment system is not properly configured. Please contact support."
      });
    }

    const { userId, plan } = req.body as InitiatePaymentRequest;

    if (!userId || !plan) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "userId and plan are required"
      });
    }

    const transactionReference = generateTransactionReference();
    const bankReference = `Heartfelt ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;

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

    const baseUrl = process.env.REPLIT_DEPLOYMENT_URL 
      ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
      : process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:5000";
    
    console.log("Base URL for callbacks:", baseUrl);

    const successUrl = `${baseUrl}/payment/success?ref=${transactionReference}`;
    const cancelUrl = `${baseUrl}/payment/cancel?ref=${transactionReference}`;
    const errorUrl = `${baseUrl}/payment/error?ref=${transactionReference}`;
    const notifyUrl = `${baseUrl}/api/ozow/notify`;

    const amountFormatted = amount.toFixed(2);

    const hashCheck = generateHash({
      siteCode: OZOW_SITE_CODE,
      countryCode: "ZA",
      currencyCode: "ZAR",
      amount: amountFormatted,
      transactionReference,
      bankReference: bankReference,
      cancelUrl,
      errorUrl,
      successUrl,
      notifyUrl,
      isTest: IS_TEST.toString(),
      privateKey: OZOW_PRIVATE_KEY,
    });

    const insertResult = await pool.query(
      `INSERT INTO payments (transaction_reference, user_id, plan, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (transaction_reference) 
       DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         plan = EXCLUDED.plan,
         amount = EXCLUDED.amount,
         updated_at = NOW()
       RETURNING id`,
      [transactionReference, userId, plan, amount, "pending"]
    );

    if (insertResult.rows.length === 0) {
      return res.status(500).json({
        error: "Failed to create payment record",
        message: "Could not initialize payment. Please try again."
      });
    }

    const paymentData = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: amountFormatted,
      TransactionReference: transactionReference,
      BankReference: bankReference,
      CancelUrl: cancelUrl,
      ErrorUrl: errorUrl,
      SuccessUrl: successUrl,
      NotifyUrl: notifyUrl,
      IsTest: IS_TEST,
      HashCheck: hashCheck,
    };

    console.log("=== OZOW PAYMENT DATA GENERATED ===");
    console.log("Payment URL:", OZOW_PAY_URL);
    console.log("Transaction Reference:", transactionReference);
    console.log("Amount:", amountFormatted);
    console.log("Success URL:", successUrl);
    console.log("Notify URL:", notifyUrl);
    console.log("HashCheck length:", hashCheck.length);

    return res.json({
      status: "ok",
      paymentUrl: OZOW_PAY_URL,
      paymentData,
    });
  } catch (error) {
    console.error("Ozow initiate error:", error);
    return res.status(500).json({
      error: "Failed to initiate payment",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.use("/notify", express.urlencoded({ extended: true }));

router.post("/notify", async (req, res) => {
  console.log("=== OZOW NOTIFY RECEIVED ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  try {

    const {
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      CurrencyCode,
      IsTest,
      StatusMessage,
      Hash,
    } = req.body;

    if (!TransactionReference) {
      console.warn("Missing TransactionReference in Ozow callback");
      return res.status(200).json({ ok: true, message: "Missing TransactionReference" });
    }

    const paymentResult = await pool.query(
      `SELECT * FROM payments WHERE transaction_reference = $1`,
      [TransactionReference]
    );

    if (paymentResult.rows.length === 0) {
      console.error(`SECURITY: No payment record found for ${TransactionReference}. This callback was not initiated by our system.`);
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentResult.rows[0];

    if (!Hash) {
      console.error(`SECURITY: Missing Hash in Ozow callback for ${TransactionReference}. Rejecting request.`);
      return res.status(403).json({ error: "Missing signature" });
    }

    if (!OZOW_PRIVATE_KEY) {
      console.error(`SECURITY: Private key not configured. Cannot verify Ozow callbacks.`);
      return res.status(500).json({ error: "Server configuration error" });
    }

    const isValidHash = verifyOzowNotificationHash({
      siteCode: SiteCode || OZOW_SITE_CODE,
      transactionId: TransactionId || "",
      transactionReference: TransactionReference,
      amount: Amount || payment.amount.toString(),
      status: Status || "",
      currencyCode: CurrencyCode || "ZAR",
      isTest: IsTest?.toString() || IS_TEST.toString(),
      statusMessage: StatusMessage || "",
      privateKey: OZOW_PRIVATE_KEY,
      receivedHash: Hash,
    });

    if (!isValidHash) {
      console.error(`SECURITY: Invalid hash for transaction ${TransactionReference}. Possible tampering attempt.`);
      return res.status(403).json({ error: "Invalid signature" });
    }

    console.log(`Hash verified successfully for transaction ${TransactionReference}`);

    let newStatus = payment.status;
    if (Status === "Complete" || Status === "Completed") {
      newStatus = "complete";
    } else if (Status === "Cancelled") {
      newStatus = "cancelled";
    } else if (Status === "Error" || Status === "Abandoned") {
      newStatus = "error";
    }

    if (newStatus !== payment.status) {
      await pool.query(
        `UPDATE payments 
         SET status = $1, ozow_transaction_id = $2, verified_at = $3, updated_at = NOW()
         WHERE transaction_reference = $4`,
        [newStatus, TransactionId, newStatus === "complete" ? new Date() : null, TransactionReference]
      );

      if (newStatus === "complete" && payment.user_id !== "unknown") {
        const updatedPayment = await pool.query(
          `SELECT id FROM payments WHERE transaction_reference = $1`,
          [TransactionReference]
        );
        
        const paymentId = updatedPayment.rows[0]?.id;
        
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan, is_active, activated_at, payment_id)
           VALUES ($1, $2, true, NOW(), $3)
           ON CONFLICT (user_id) DO UPDATE SET
             plan = EXCLUDED.plan,
             is_active = true,
             activated_at = NOW(),
             payment_id = EXCLUDED.payment_id,
             updated_at = NOW()`,
          [payment.user_id, payment.plan, paymentId]
        );
        
        console.log(`Subscription ACTIVATED for user ${payment.user_id}, plan: ${payment.plan}, payment_id: ${paymentId}`);
      }
    }

    console.log(`Payment status updated for ${TransactionReference}: ${payment.status} -> ${newStatus}`);
    console.log("=== OZOW NOTIFY COMPLETE ===");

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Ozow notify error:", error);
    return res.status(200).json({ ok: true, error: "Processing error" });
  }
});

router.get("/verify/:transactionReference", async (req, res) => {
  try {
    const { transactionReference } = req.params;
    
    const paymentResult = await pool.query(
      `SELECT * FROM payments WHERE transaction_reference = $1`,
      [transactionReference]
    );
    
    if (paymentResult.rows.length === 0) {
      return res.json({
        verified: false,
        status: "not_found",
        message: "No payment found for this reference"
      });
    }

    const payment = paymentResult.rows[0];

    return res.json({
      verified: payment.status === "complete",
      status: payment.status,
      userId: payment.user_id,
      plan: payment.plan,
      amount: parseFloat(payment.amount),
      verifiedAt: payment.verified_at,
    });
  } catch (error) {
    console.error("Ozow verify error:", error);
    return res.status(500).json({
      verified: false,
      status: "error",
      message: "Failed to verify payment"
    });
  }
});

router.post("/confirm-payment", async (req, res) => {
  try {
    const { transactionReference } = req.body;

    if (!transactionReference) {
      return res.status(400).json({
        success: false,
        message: "Transaction reference is required"
      });
    }

    const paymentResult = await pool.query(
      `SELECT p.*, s.id as subscription_id 
       FROM payments p 
       LEFT JOIN subscriptions s ON p.user_id = s.user_id AND s.is_active = true
       WHERE p.transaction_reference = $1`,
      [transactionReference]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payment found for this reference"
      });
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== "complete") {
      return res.status(402).json({
        success: false,
        status: payment.status,
        message: payment.status === "pending" 
          ? "Payment is still being processed. Please wait for confirmation."
          : `Payment was not successful. Status: ${payment.status}`
      });
    }

    return res.json({
      success: true,
      userId: payment.user_id,
      plan: payment.plan,
      amount: parseFloat(payment.amount),
      verifiedAt: payment.verified_at,
      subscriptionActive: !!payment.subscription_id,
      message: "Payment verified and subscription activated"
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment"
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
