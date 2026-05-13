# PayPal Billing Setup

Complete guide to configure PayPal subscriptions for PressKit Pro. This covers sandbox testing and production deployment.

## Overview

PressKit Pro uses PayPal subscriptions with three billing tiers:

| Plan | Monthly | Annual |
|------|---------|--------|
| **Pro** | $12/mo | $10/mo (2 months free) |
| **Agency** | $39/mo | $33/mo (2 months free) |

Each plan requires a separate Plan ID in PayPal, configured via environment variables:
- `PAYPAL_PLAN_ID_PRO_MONTHLY`
- `PAYPAL_PLAN_ID_PRO_ANNUAL`
- `PAYPAL_PLAN_ID_AGENCY_MONTHLY`
- `PAYPAL_PLAN_ID_AGENCY_ANNUAL`

---

## 1. Create a PayPal Business Account

If you don't have one:

1. Go to [PayPal Business Signup](https://www.paypal.com/business/signup)
2. Complete the registration with business details
3. Verify your email and phone

---

## 2. Register a Developer App

All API interactions require OAuth credentials.

### Register your app

1. Log into [PayPal Developer Dashboard](https://developer.paypal.com)
2. Navigate to **Apps & Credentials**
3. Select the **Sandbox** or **Live** tab (start with Sandbox)
4. Click **Create App** under "Your Apps"
5. App name: `PressKit Pro` (or similar)
6. App type: `Merchant` (Business)
7. Click **Create App**

### Get OAuth credentials

1. Your new app appears in the list
2. Click it to open details
3. Copy these values to your `.env`:
   - **Client ID** → `PAYPAL_CLIENT_ID`
   - **Secret** → `PAYPAL_CLIENT_SECRET`

```bash
# In .env
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_SECRET
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com  # Change to production later
```

---

## 3. Create Subscription Plans

Subscription plans define the pricing and billing schedule. You'll create 4 plans total (2 per tier).

### Create Pro Monthly ($12/month)

1. PayPal Dashboard → **Products & Services** → **Plans**
2. Click **Create Plan**
3. Fill in:
   - **Name**: `PressKit Pro - Monthly`
   - **Description**: `Professional plan for PressKit Pro - monthly billing`
   - **Billing frequency**: `Monthly`
   - **Billing price**: `$12.00 USD`
   - **Billing cycles**: `0` (infinite/until cancelled)
   - **Setup fee**: `$0.00` (optional)

4. Click **Create Plan**
5. Copy the **Plan ID** → Paste into `PAYPAL_PLAN_ID_PRO_MONTHLY` in `.env`

Example Plan ID format: `P-ABC123XYZ456DEF`

### Create Pro Annual ($10/month = $120/year)

1. Click **Create Plan** again
2. Fill in:
   - **Name**: `PressKit Pro - Annual`
   - **Description**: `Professional plan for PressKit Pro - annual billing`
   - **Billing frequency**: `Yearly`
   - **Billing price**: `$120.00 USD` (= $10/month)
   - **Billing cycles**: `0` (infinite/until cancelled)

3. Copy Plan ID → `PAYPAL_PLAN_ID_PRO_ANNUAL`

### Create Agency Monthly ($39/month)

1. Click **Create Plan** again
2. Fill in:
   - **Name**: `PressKit Pro - Agency Monthly`
   - **Description**: `Agency plan for PressKit Pro - monthly billing`
   - **Billing frequency**: `Monthly`
   - **Billing price**: `$39.00 USD`
   - **Billing cycles**: `0`

3. Copy Plan ID → `PAYPAL_PLAN_ID_AGENCY_MONTHLY`

### Create Agency Annual ($33/month = $396/year)

1. Click **Create Plan** again
2. Fill in:
   - **Name**: `PressKit Pro - Agency Annual`
   - **Description**: `Agency plan for PressKit Pro - annual billing`
   - **Billing frequency**: `Yearly`
   - **Billing price**: `$396.00 USD` (= $33/month)
   - **Billing cycles**: `0`

3. Copy Plan ID → `PAYPAL_PLAN_ID_AGENCY_ANNUAL`

---

## 4. Configure Environment Variables

Update `.env` with all four Plan IDs:

```bash
# PayPal Plan IDs (from Products & Services → Plans)
PAYPAL_PLAN_ID_PRO_MONTHLY=P-YOUR_PRO_MONTHLY_ID
PAYPAL_PLAN_ID_PRO_ANNUAL=P-YOUR_PRO_ANNUAL_ID
PAYPAL_PLAN_ID_AGENCY_MONTHLY=P-YOUR_AGENCY_MONTHLY_ID
PAYPAL_PLAN_ID_AGENCY_ANNUAL=P-YOUR_AGENCY_ANNUAL_ID
```

---

## 5. Register a Webhook

PayPal notifies your app of subscription events (started, cancelled, renewed). You must register a webhook endpoint.

### Create the webhook

1. PayPal Dashboard → **Apps & Credentials**
2. Scroll to **Webhooks** section
3. Click **Create Webhook**
4. Webhook URL: Use your dev tunnel or production URL:
   - **Local dev**: `https://<your-tunnel>.ngrok.io/api/webhooks/paypal`
   - **Production**: `https://presskit.pro/api/webhooks/paypal`

5. Event types to subscribe to:
   - ✓ `BILLING.SUBSCRIPTION.CREATED`
   - ✓ `BILLING.SUBSCRIPTION.ACTIVATED`
   - ✓ `BILLING.SUBSCRIPTION.UPDATED`
   - ✓ `BILLING.SUBSCRIPTION.CANCELLED`
   - ✓ `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`
   - ✓ `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - ✓ `BILLING.SUBSCRIPTION.EXPIRED`

6. Click **Create Webhook**
7. Copy the **Webhook ID** → Add to `.env`:

```bash
PAYPAL_WEBHOOK_ID=WH_YOUR_WEBHOOK_ID
```

### Webhook URL requirements

The `/api/webhooks/paypal` endpoint must be publicly accessible. For local testing, use a tunnel:

```bash
# Using ngrok
ngrok http 3000

# Update .env NEXT_PUBLIC_APP_URL with the tunnel URL
NEXT_PUBLIC_APP_URL=https://YOUR_TUNNEL.ngrok.io
```

---

## 6. Test the Sandbox Integration

### Verify the checkout flow

1. Start dev server: `pnpm dev`
2. Navigate to the pricing page
3. Try checkout on any plan
4. You should be redirected to PayPal (or their sandbox)
5. Use PayPal sandbox test account to complete a subscription

### Create a test account (if needed)

1. PayPal Dashboard → **Accounts** → **Sandbox** tab
2. Under "Sandbox Business Accounts", click **Create Account**
3. Account type: `Personal` (to simulate a buyer)
4. Use the generated email/password at checkout

### Check subscription status

After a sandbox subscription is created, verify in the database:

```sql
select * from payload.users
where email = 'your-test-account@example.com';
```

You should see:
- `paypal_subscription_id` populated
- `paypal_plan_id` matching one of your Plan IDs
- `subscription_status: 'ACTIVE'`

### Monitor webhook events

PayPal sends webhook events to your endpoint. Check the payload logs:

```sql
select * from payload.paypal_webhook_events
order by created_at desc
limit 10;
```

Look for:
- `event_type: 'BILLING.SUBSCRIPTION.CREATED'`
- `event_type: 'BILLING.SUBSCRIPTION.ACTIVATED'`

---

## 7. Switch to Production

When ready to go live:

### Step 1: Create production plans

1. PayPal Dashboard → Switch to **Live** tab (not Sandbox)
2. Repeat steps 3–4 above to create 4 production plans
3. Copy each production Plan ID

### Step 2: Update environment

```bash
# Switch API endpoint
PAYPAL_API_BASE=https://api-m.paypal.com

# Update credentials (Live tab, same place)
PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_LIVE_SECRET

# Update Plan IDs with production values
PAYPAL_PLAN_ID_PRO_MONTHLY=P-YOUR_PROD_PRO_MONTHLY
PAYPAL_PLAN_ID_PRO_ANNUAL=P-YOUR_PROD_PRO_ANNUAL
PAYPAL_PLAN_ID_AGENCY_MONTHLY=P-YOUR_PROD_AGENCY_MONTHLY
PAYPAL_PLAN_ID_AGENCY_ANNUAL=P-YOUR_PROD_AGENCY_ANNUAL

# Register production webhook
PAYPAL_WEBHOOK_ID=WH_YOUR_PROD_WEBHOOK_ID
```

### Step 3: Re-register webhook (production)

1. PayPal Dashboard → **Apps & Credentials** → **Live** tab
2. Create webhook with your production URL: `https://presskit.pro/api/webhooks/paypal`
3. Subscribe to same events as sandbox
4. Update `PAYPAL_WEBHOOK_ID`

### Step 4: Deploy

Deploy to production with updated `.env` values.

---

## 8. Troubleshooting

### "Plan ID not configured"

**Symptom**: Error message when trying to checkout

```
PayPal Plan ID não configurado para pro-monthly.
```

**Fix**:
1. Verify `PAYPAL_PLAN_ID_PRO_MONTHLY` is set in `.env`
2. Verify it's a valid Plan ID from PayPal (format: `P-XXXXX`)
3. Restart dev server: `pnpm dev`

### "PayPal subscription creation failed"

**Symptom**: HTTP error from PayPal API

**Debug**:
1. Check browser console for full error message
2. Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are correct
3. Verify you're using the right API endpoint (`sandbox` vs `live`)
4. Check that the Plan ID exists in PayPal dashboard

### Webhook events not being recorded

**Symptom**: No entries in `payload_webhook_events` table after subscription

**Debug**:
1. Verify webhook URL is publicly accessible:
   ```bash
   curl https://YOUR_WEBHOOK_URL
   ```
   Should NOT return 404.

2. Check PayPal webhook logs:
   - Dashboard → **Apps & Credentials** → **Webhooks**
   - Click your webhook → **View Recent Events**
   - Look for delivery failures

3. Verify webhook signature verification is working in code:
   - `/app/api/webhooks/paypal/route.ts`
   - Ensure `PAYPAL_WEBHOOK_ID` matches the webhook you registered

### Subscription created but not activated in database

**Symptom**: `subscription_status: 'PENDING'` instead of `'ACTIVE'`

**Why**: PayPal subscriptions go through states: `CREATED` → `ACTIVATED` → `ACTIVE`. Wait a few seconds for the full flow.

**Debug**:
```sql
select event_type, payload
from payload.paypal_webhook_events
where user_id = (
  select id from payload.users where email = 'test@example.com'
)
order by created_at;
```

Look for `BILLING.SUBSCRIPTION.ACTIVATED` event.

---

## 9. API Reference

### Subscription create request

The checkout form sends:

```json
{
  "plan_id": "P-ABC123XYZ",
  "subscriber": {
    "email_address": "user@example.com"
  },
  "application_context": {
    "return_url": "https://presskit.pro/dashboard",
    "cancel_url": "https://presskit.pro/pricing",
    "user_action": "SUBSCRIBE_NOW",
    "brand_name": "PressKit Pro",
    "locale": "pt-BR"
  },
  "custom_id": "12345"
}
```

### Webhook event types

| Event | Meaning |
|-------|---------|
| `BILLING.SUBSCRIPTION.CREATED` | Plan set up but awaiting buyer approval |
| `BILLING.SUBSCRIPTION.ACTIVATED` | Buyer approved; first payment pending |
| `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED` | Payment received |
| `BILLING.SUBSCRIPTION.CANCELLED` | User or system cancelled |
| `BILLING.SUBSCRIPTION.EXPIRED` | Subscription reached end date |

---

## 10. Quick Reference

### Sandbox credentials

- Dashboard: https://developer.paypal.com
- Tab: **Sandbox**
- API: `https://api-m.sandbox.paypal.com`

### Production credentials

- Dashboard: https://www.paypal.com (then navigate to account settings)
- Tab: **Live**
- API: `https://api-m.paypal.com`

### Key env vars

```bash
PAYPAL_CLIENT_ID              # OAuth Client ID
PAYPAL_CLIENT_SECRET          # OAuth Secret
PAYPAL_API_BASE               # https://api-m.sandbox.paypal.com or production
PAYPAL_WEBHOOK_ID             # Webhook registration ID
PAYPAL_PLAN_ID_PRO_MONTHLY    # Plan ID for Pro monthly
PAYPAL_PLAN_ID_PRO_ANNUAL     # Plan ID for Pro annual
PAYPAL_PLAN_ID_AGENCY_MONTHLY # Plan ID for Agency monthly
PAYPAL_PLAN_ID_AGENCY_ANNUAL  # Plan ID for Agency annual
```

### Related code files

- Plan definitions: `lib/pricing/plans.ts`
- Subscription creation: `lib/billing/create-paypal-subscription.ts`
- Webhook handler: `app/api/webhooks/paypal/route.ts`
- Plan ID mapping: `lib/pricing/paypal-plan-id-to-plan.ts`
