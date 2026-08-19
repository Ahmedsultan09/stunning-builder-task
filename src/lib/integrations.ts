export const INTEGRATION_IDS = [
  "stripe",
  "shopify",
  "gmail",
  "slack",
  "google-sheets",
] as const;

export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export type Integration = {
  id: IntegrationId;
  name: string;
  description: string;
  systemContext: string;
};

export const INTEGRATIONS: readonly Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments and subscriptions",
    systemContext:
      "Design payment, billing, subscription, and webhook touchpoints where relevant.",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Catalog and commerce workflows",
    systemContext:
      "Account for products, customers, orders, and commerce data synchronization.",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Email-triggered workflows",
    systemContext:
      "Include useful email notifications, inbound triggers, and human communication steps.",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team alerts and approvals",
    systemContext:
      "Include team notifications, operational alerts, and approval loops when useful.",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Lightweight data and reporting",
    systemContext:
      "Consider spreadsheet import, export, synchronization, and reporting workflows.",
  },
] as const;

export const INTEGRATION_BY_ID = new Map(
  INTEGRATIONS.map((integration) => [integration.id, integration]),
);
