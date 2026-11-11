# 1960.com

A Nigerian export marketplace for international buyers and the diaspora. The identity honours Nigeria's independence on 1 October 1960. Built with Next.js, React and Supabase.

## What works

- Responsive marketplace with product, company and origin search; category, retail/bulk, origin and verification filters; price and name sorting; saved products stored on the visitor's device.
- Separate buyer, supplier and logistics partner registration, email confirmation, sign-in, password recovery and editable business profiles.
- Google sign-in with a one-time buyer, supplier or logistics profile setup, plus confirmation-email resending for email accounts.
- Supplier product publishing, editing and removal, listing photos, public supplier catalogues and searchable supplier/logistics directories.
- Buyer sourcing requests, supplier quotations and price revisions, quotation messaging, acceptance into orders, private documents and supplier-reported tracking.
- Logistics requests from confirmed orders, pickup/destination details, provider quotations, comparisons and assignment.
- Product checkout using Paystack, an explicit NGN review step, a frozen operator-set USD/NGN rate, authenticated server verification, signed webhooks and payment receipts.

Samples are labelled and cannot be ordered. Without Supabase configuration the public app remains explorable and account actions show a setup state.

## Run locally

Use Node.js 22.18 or newer and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev -- --port 3010
```

On PowerShell, use `Copy-Item .env.example .env.local`. Populate the two `NEXT_PUBLIC_SUPABASE_*` variables with your project settings. Restart the app after changing environment variables. Do not commit `.env.local` or server keys.

## Database setup

Back up an existing database before applying schema changes.

For a **new database**, run these files in the Supabase SQL Editor in order:

1. `supabase/naijabulk_all.sql` (the consolidated original schema, storage, roles, messages and logistics).
2. `supabase/1960_upgrade.sql` (new profile editing, listing edits, validation, transaction locks, document checks and payment records).
3. `supabase/1960_google_auth.sql` (Google-compatible signup trigger and one-time account onboarding).

For an **existing database with the consolidated schema already applied**, apply only the upgrades you have not yet applied, in order: `supabase/1960_upgrade.sql`, then `supabase/1960_google_auth.sql`. If the first upgrade has already been applied, run only the Google auth upgrade. If your database was set up from individual legacy SQL files, ensure all original migrations and the retail/unit additions at the end of `naijabulk_all.sql` are present first. Do not rerun the consolidated base or previously applied upgrades. Keep a record of applying each transactional migration.

In Supabase Authentication:

- Enable email/password sign-in and email confirmation.
- Set the Site URL to your application origin.
- Add `<your-origin>/auth/confirm` and `<your-origin>/auth/reset` to allowed redirect URLs; include local equivalents for development.
- Configure email delivery for confirmation and password reset messages.
- Set a suitable password policy, at least the app's 10-character signup minimum.

The signup trigger creates each profile. Only an operator should set `is_admin` in the database. Admins review supplier evidence and manage verification at `/admin`. Editing company identity or provider service resets verification. Payment never grants verification.

## Google sign-in and account troubleshooting

Google sign-in must be enabled in your Supabase project. The application button cannot enable a provider or create Google OAuth credentials automatically.

1. Apply `supabase/1960_google_auth.sql`. Without it, Google registrations may fail because the older signup trigger requires business metadata Google does not supply.
2. In Google Cloud Console, configure an OAuth consent screen and a **Web application** OAuth client. Use the Supabase Google provider panel's callback URL (usually `https://<project-ref>.supabase.co/auth/v1/callback`) as the Google client's authorized redirect URI. This is different from the application's callback URL.
3. Add your deployed application's origin to the Google client's authorized JavaScript origins. Follow Google's publishing/verification requirements, or add testers while the OAuth app remains in testing.
4. In Supabase Authentication > Sign In / Providers > Google, enable Google and enter the OAuth client ID and client secret. Keep the Google client secret in Supabase, never in browser code or this repository.
5. In Supabase URL Configuration, set the production Site URL and allow the application callback, including its query parameters, for example `https://<your-domain>/auth/confirm**`. Add `http://localhost:3010/auth/confirm**` only for local development. Add the password reset redirect as described above.
6. Set `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on the deployment host, then **rebuild/redeploy**. Next.js embeds public environment variables at build time.
7. Test a new Google account, complete its profile, then sign out and sign back in. Existing members retain their account role; only a new incomplete account can choose a role during onboarding. Test email signup, confirmation, confirmation resending and password recovery separately.

Email accounts require confirmation when the project's confirmation setting is enabled. If emails do not arrive, check Supabase email delivery configuration, provider limits and the recipient's spam folder. A disabled account button with a setup notice means the public project environment variables are missing or placeholders. A "Database error saving new user" generally requires checking the signup trigger and migration status in Supabase logs. Do not disable confirmation to conceal a delivery problem.

Official reference: [Supabase Google sign-in setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

The homepage places search, category navigation, featured product collections and filtered listings first. The independence story lives at `/about`. Collections are curated navigation, not fabricated sales or trending rankings.

## Enable payments

Payments are disabled until every server-only setting in `.env.example` is configured. Start with Paystack **test keys**.

1. Set `SUPABASE_SERVICE_ROLE_KEY` on the server.
2. Set `PAYSTACK_SECRET_KEY`, `SITE_URL` and `PAYMENT_USD_NGN_RATE`. The rate is the operator-approved NGN value of USD 1, not a live FX feed.
3. Add `https://<your-origin>/api/payments/webhook` in the Paystack dashboard. Webhooks require a publicly reachable HTTPS deployment.
4. Run the database upgrade and deploy the app with server routes enabled.
5. Create a buyer and supplier, publish a live listing, submit an RFQ, quote, accept and open the resulting order's **Review & pay** link.
6. Confirm the review amount and use Paystack's documented test payment details. Verify both callback reconciliation and webhook reconciliation before enabling live keys.

The backend calculates the product amount from the stored order, freezes the NGN rate and reference per order, and verifies transaction reference, order metadata, amount, currency and successful status. Browser clients cannot write payment records or call settlement. Repeated callbacks/webhooks settle the same order once. The buyer can use **Check payment status** after returning from checkout, including when a payment is delayed.

This integration collects the **product amount for the marketplace operator**. It does not implement escrow, automated supplier split payouts, automated refunds, freight checkout or customs collection. Agree seller fulfilment, payouts, cancellation and refund operations before taking live payments. International card acceptance depends on your Paystack account and enabled channels. Product discovery/RFQs support retail pack quantities as well as bulk sourcing; purchases use an agreed supplier quotation rather than an instant cart.

References: [Paystack transactions](https://paystack.com/docs/api/transaction/), [payment verification](https://paystack.com/docs/payments/verify-payments/), [webhook signatures](https://paystack.com/docs/payments/webhooks/).

## Deployment

Import `Terracons/exp9ja` into your Next.js-compatible host, configure environment variables and use `npm run build`. Apply the database migration separately. Add production auth redirect URLs and the webhook URL. The app rebrand does not register or configure the `1960.com` domain; connect a domain you control through your host and DNS provider.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Tests use an isolated in-memory PostgreSQL database, never your Supabase project. They cover the original schema plus the upgrade, account roles, listing ownership, positive quantities, quote identity/acceptance, unit propagation, logistics assignment, private documents, read receipts, payment write permissions and idempotent settlement. Unit tests cover discovery filters/sorting, safe local redirects and payment amount/identity validation.

Before live launch, also verify email delivery and recovery, test merchant checkout/webhooks, supplier payout operations and destination-specific product eligibility in the configured deployment. These depend on the operator's accounts and credentials and cannot be established by a local build alone.
