/**
 * Admin API layer — one module per back-office category. Every module exports plain service
 * functions, React Query key factories (`<area>Keys`) and `queryOptions` factories (`<area>Queries`).
 * Types are derived from `@/types/openapi` via `operation-types` wherever the spec models them
 * exactly, and from `contract` for the legacy/`dict` shapes the spec leaves untyped.
 */

export * from "@/lib/api/client";
export * from "@/lib/api/contract";
export * from "@/lib/api/operation-types";

// Auth & access control
export * from "@/lib/api/auth/admin-auth";
export * from "@/lib/api/iam/rbac";

// Dashboard
export * from "@/lib/api/dashboard/dashboard";

// Sales
export * from "@/lib/api/sales/orders";
export * from "@/lib/api/sales/payments";

// Customers
export * from "@/lib/api/customers/customers";
export * from "@/lib/api/customers/directory";
export * from "@/lib/api/customers/tickets";

// Learning
export * from "@/lib/api/learning/catalog";
export * from "@/lib/api/learning/bundles";
export * from "@/lib/api/learning/consultations";

// Marketing
export * from "@/lib/api/marketing/promotions";
export * from "@/lib/api/marketing/referrals";

// Analytics & reporting
export * from "@/lib/api/analytics/reports";

// Settings & system
export * from "@/lib/api/settings/legacy-settings";
export * from "@/lib/api/system/health";

// Legacy mirror gateway
export * from "@/lib/api/legacy/legacy";
export * from "@/lib/api/legacy/resources";
