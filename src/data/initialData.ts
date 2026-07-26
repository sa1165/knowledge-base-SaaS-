import { Article, Category, PortalSettings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-getting-started',
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Essential guides, quickstart tutorials, and setup instructions to get up and running.',
    iconName: 'Rocket',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'cat-api-webhooks',
    name: 'API & Webhooks',
    slug: 'api-webhooks',
    description: 'REST API reference, authentication headers, SDK usage, and event webhooks.',
    iconName: 'Code2',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'cat-account-billing',
    name: 'Account & Billing',
    slug: 'account-billing',
    description: 'Managing subscriptions, team seats, invoicing details, and upgrade plans.',
    iconName: 'CreditCard',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'cat-security-compliance',
    name: 'Security & SSO',
    slug: 'security-sso',
    description: 'SAML SSO integration, 2FA enforcement, audit logs, and compliance certifications.',
    iconName: 'ShieldCheck',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'cat-troubleshooting',
    name: 'Troubleshooting',
    slug: 'troubleshooting',
    description: 'Solutions for common error codes, rate limits, latency diagnostics, and edge cases.',
    iconName: 'Wrench',
    color: 'from-rose-500 to-pink-500'
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-quickstart',
    slug: 'quickstart-guide',
    title: 'Platform Quickstart & Workspace Overview',
    summary: 'Learn how to create your workspace, invite team members, and generate your primary API keys in under 5 minutes.',
    categoryId: 'cat-getting-started',
    status: 'published',
    views: 1420,
    helpfulCount: 238,
    unhelpfulCount: 12,
    readTimeMinutes: 4,
    tags: ['quickstart', 'onboarding', 'workspace'],
    author: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Head of Developer Experience'
    },
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-07-20T14:30:00Z',
    content: `
# Platform Quickstart & Workspace Overview

Welcome to **NovaBase Knowledge Hub**! This guide walks you through setting up your organization's workspace, configuring environment permissions, and verifying initial connectivity.

## Step 1: Initializing Your Workspace

Once logged into your dashboard, click **Create Organization** in the top navigation bar. Choose a unique slug for your portal domain.

> [!TIP]
> Use a clean, lowercase hyphenated string for your workspace domain (e.g. \`acme-corp.novabase.io\`).

## Step 2: Generating API Keys

To integrate with our SDKs or API endpoints:
1. Navigate to **Settings > API Access Keys**.
2. Click **Generate New Secret Token**.
3. Select appropriate scopes (\`read:articles\`, \`write:articles\`, \`admin:analytics\`).
4. Copy the generated secret key and store it securely in your environment variables.

\`\`\`bash
# Sample connection test command
curl -X GET "https://api.novabase.io/v1/health" \\
  -H "Authorization: Bearer nvk_live_89f2a71c9b3e" \\
  -H "Content-Type: application/json"
\`\`\`

## Step 3: Inviting Workspace Teammates

Collaboration is built directly into NovaBase. Go to **Team Members**, enter email addresses, and set role permissions:
- **Admin**: Full workspace access and billing control.
- **Editor**: Can publish, revise, and categorize articles.
- **Viewer**: Read-only access to drafts and internal articles.

---
Need further assistance? Use our floating **AI Assistant** at the bottom right corner of any page!
`
  },
  {
    id: 'art-api-auth',
    slug: 'api-authentication-rate-limits',
    title: 'API Authentication & Rate Limiting Guidelines',
    summary: 'Detailed explanation of OAuth2 Bearer Tokens, API key rotation, request headers, and HTTP 429 rate limit handling.',
    categoryId: 'cat-api-webhooks',
    status: 'published',
    views: 2890,
    helpfulCount: 412,
    unhelpfulCount: 18,
    readTimeMinutes: 7,
    tags: ['api', 'authentication', 'rate-limits', 'headers'],
    author: {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Lead API Architect'
    },
    createdAt: '2026-06-01T09:15:00Z',
    updatedAt: '2026-07-22T11:20:00Z',
    content: `
# API Authentication & Rate Limiting Guidelines

All REST requests to NovaBase must be executed over HTTPS with valid credential headers.

## Authentication Headers

Pass your token in the \`Authorization\` header as a Bearer token:

\`\`\`javascript
// JavaScript Fetch Example
const response = await fetch('https://api.novabase.io/v1/articles', {
  headers: {
    'Authorization': \`Bearer \${process.env.NOVABASE_API_KEY}\`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
\`\`\`

## Rate Limits & Quotas

Our API enforces tiered rate limits based on your active plan:

| Plan Tier | Request Ceiling | Window | Burst Allowance |
| :--- | :--- | :--- | :--- |
| **Starter** | 60 requests | 1 minute | 10 req/sec |
| **Pro** | 600 requests | 1 minute | 50 req/sec |
| **Enterprise** | Custom SLA | 1 minute | Unlimited |

### Rate Limit Response Headers

When making requests, inspect the returned response headers to monitor capacity:

\`\`\`http
HTTP/1.1 200 OK
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 582
X-RateLimit-Reset: 1721865600
\`\`\`

### Handling HTTP 429 Too Many Requests

If your application exceeds rate limits, the API responds with HTTP 429:

\`\`\`json
{
  "error": "rate_limit_exceeded",
  "message": "Quota exceeded. Retry after 24 seconds.",
  "retry_after_seconds": 24
}
\`\`\`

Implement exponential backoff with random jitter in your client code to gracefully recover.
`
  },
  {
    id: 'art-sso-saml',
    slug: 'configuring-saml-sso-okta',
    title: 'Configuring Enterprise SAML SSO with Okta & Azure AD',
    summary: 'Step-by-step guide to enforce Single Sign-On (SSO) for your team using SAML 2.0 Identity Providers.',
    categoryId: 'cat-security-compliance',
    status: 'published',
    views: 940,
    helpfulCount: 165,
    unhelpfulCount: 5,
    readTimeMinutes: 6,
    tags: ['security', 'saml', 'sso', 'okta', 'azure-ad'],
    author: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Director of Information Security'
    },
    createdAt: '2026-06-15T14:00:00Z',
    updatedAt: '2026-07-18T16:45:00Z',
    content: `
# Configuring Enterprise SAML SSO

Enabling SAML 2.0 SSO allows enterprise organizations to manage authentication centrally via Okta, Microsoft Azure AD (Entra ID), or Google Workspace.

## Prerequisites
- NovaBase Enterprise Plan.
- Admin access to your Identity Provider (IdP).

## Configuration Values

Provide the following metadata URL and parameters inside your IdP application settings:

- **ACS URL (Assertion Consumer Service)**: \`https://auth.novabase.io/saml/acs\`
- **Entity ID (Audience URI)**: \`urn:novabase:sp:auth\`
- **Name ID Format**: \`EmailAddress\`

## Attribute Mapping

Map the following SAML claims to standard user attributes:

\`\`\`json
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "user.email",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname": "user.firstName",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname": "user.lastName"
}
\`\`\`

> [!WARNING]
> Enforcing SSO will disconnect password logins for all non-admin users in your domain. Ensure SSO test login succeeds prior to clicking **Enforce SSO**.
`
  },
  {
    id: 'art-billing-seats',
    slug: 'managing-billing-and-user-seats',
    title: 'Subscription Management, Upgrades & Add-on Seats',
    summary: 'How prorated seat calculations work, modifying billing cycles, downloading PDF receipts, and updating credit card details.',
    categoryId: 'cat-account-billing',
    status: 'published',
    views: 1120,
    helpfulCount: 198,
    unhelpfulCount: 9,
    readTimeMinutes: 3,
    tags: ['billing', 'seats', 'invoices', 'upgrade'],
    author: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Head of Developer Experience'
    },
    createdAt: '2026-05-20T11:30:00Z',
    updatedAt: '2026-07-10T09:10:00Z',
    content: `
# Subscription Management & User Seats

Manage your subscription tier, billing contact details, and team capacity easily in **Admin > Billing Settings**.

## Prorated Seat Adjustments

When adding new team members mid-billing cycle:
- You are charged a prorated fee for the remaining days in the active billing period.
- Removed seats trigger a account credit towards your next invoice.

## Accessing Past Invoices

1. Go to **Admin > Billing > Invoice History**.
2. Click **Download PDF** for any past statement.
3. Invoices include full VAT breakdown and custom corporate tax ID fields.
`
  },
  {
    id: 'art-webhooks-setup',
    slug: 'webhook-events-delivery-retry',
    title: 'Setting Up Webhook Subscriptions & Signature Verification',
    summary: 'Listen to realtime platform events (article.created, feedback.submitted) with HMAC SHA-256 signature verification.',
    categoryId: 'cat-api-webhooks',
    status: 'published',
    views: 1750,
    helpfulCount: 310,
    unhelpfulCount: 7,
    readTimeMinutes: 5,
    tags: ['webhooks', 'security', 'hmac', 'events'],
    author: {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Lead API Architect'
    },
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-07-23T15:00:00Z',
    content: `
# Webhook Subscriptions & Signature Verification

Webhooks allow your application to receive automated real-time HTTP POST notifications whenever key events take place in NovaBase.

## Supported Event Types

- \`article.published\` - Emitted when an article transitions to published.
- \`article.updated\` - Emitted when article body or tags are modified.
- \`feedback.received\` - Emitted when a customer leaves helpful/unhelpful feedback.

## Verifying Webhook Signatures

NovaBase includes an HMAC signature header (\`X-Nova-Signature\`) with every payload to ensure requests originate from our servers.

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payloadBody, secret, signatureHeader) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadBody)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signatureHeader)
  );
}
\`\`\`
`
  },
  {
    id: 'art-troubleshoot-cors',
    slug: 'resolving-cors-and-origin-errors',
    title: 'Resolving Cross-Origin (CORS) & Domain Whitelisting Errors',
    summary: 'Diagnose and resolve Access-Control-Allow-Origin errors when embedding the Knowledge Widget into custom websites.',
    categoryId: 'cat-troubleshooting',
    status: 'published',
    views: 2150,
    helpfulCount: 380,
    unhelpfulCount: 22,
    readTimeMinutes: 4,
    tags: ['cors', 'troubleshooting', 'widget', 'domains'],
    author: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Director of Information Security'
    },
    createdAt: '2026-05-25T13:40:00Z',
    updatedAt: '2026-07-15T10:05:00Z',
    content: `
# Resolving CORS & Domain Whitelisting Errors

If your browser console displays \`Access to fetch at ... has been blocked by CORS policy\`, follow this troubleshooting procedure.

## Step 1: Whitelist Your Client Domain

1. Open **Admin > Portal Settings > Allowed Widget Domains**.
2. Add your host domain (e.g., \`https://app.yourcompany.com\`).
3. Ensure protocol schemes (\`https://\`) are explicitly included.

## Step 2: Inspect Preflight Requests

Browsers send an HTTP \`OPTIONS\` preflight request before cross-origin POSTs. Ensure your web proxy or CDN passes the following headers:
- \`Access-Control-Allow-Methods: GET, POST, OPTIONS\`
- \`Access-Control-Allow-Headers: Content-Type, Authorization\`
`
  }
];

export const INITIAL_SETTINGS: PortalSettings = {
  portalName: 'NovaBase Docs',
  tagline: 'Instant answers, technical documentation, and API guides for modern developers.',
  logoIcon: 'Zap',
  accentColor: '#0c8de4',
  primaryDomain: 'docs.novabase.io',
  allowPublicFeedback: true,
  enableAiAssistant: true,
  contactEmail: 'support@novabase.io'
};
