# NaijaBulk MVP

Next.js + Supabase (free tier) + Vercel (free Hobby plan).

1. Create a free project at supabase.com. In the SQL Editor, paste and run `supabase/schema.sql`.
2. Then run `supabase/images.sql` (listing photos).
3. Run `supabase/tracking.sql` (shipment tracking and admin). To become an admin, tick `is_admin` on your row in `profiles`.
4. Run `supabase/messages.sql` (messaging and quote price revisions).
5. Run `supabase/logistics.sql` (providers, freight, documents, unread badges).
6. In Supabase, Authentication > Providers > Email: turn off "Confirm email" while testing.
3. Copy `.env.example` to `.env.local` and fill in the Project URL and anon key (Project Settings > API).
4. `npm install` then `npm run dev`.
5. Push to GitHub, import the repo in Vercel, add the same two environment variables, deploy.
6. To mark a supplier as verified, open the `profiles` table in Supabase and tick `verified`.
