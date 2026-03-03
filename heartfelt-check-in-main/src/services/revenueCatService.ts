import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

const RC_APPLE_KEY = "test_ihGcNfXmeUGuwOAGjINewDmrveG";

export const ENTITLEMENT_PRO = "pro";

export function isIOS(): boolean {
  return Capacitor.getPlatform() === "ios";
}

export async function initRevenueCat(): Promise<void> {
  if (!isIOS()) return;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey: RC_APPLE_KEY });
    console.log("[RevenueCat] Initialized");
  } catch (err) {
    console.error("[RevenueCat] Init failed:", err);
  }
}

export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  if (!isIOS()) return [];
  try {
    const { current } = await Purchases.getOfferings();
    return current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

export async function hasProEntitlement(): Promise<boolean> {
  if (!isIOS()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_PRO] !== undefined;
  } catch {
    return false;
  }
}

export type PurchaseResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; cancelled: boolean; error: string };

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: true, customerInfo };
  } catch (err: any) {
    return {
      success: false,
      cancelled: err?.userCancelled === true,
      error: err?.message ?? "Purchase failed",
    };
  }
}

export type RestoreResult =
  | { success: true; isPro: boolean }
  | { success: false; error: string };

export async function restoreApplePurchases(): Promise<RestoreResult> {
  if (!isIOS()) return { success: false, error: "Not on iOS" };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isPro =
      customerInfo.entitlements.active[ENTITLEMENT_PRO] !== undefined;
    return { success: true, isPro };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Restore failed" };
  }
}
