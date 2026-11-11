import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("database migration, roles, quotations, logistics, private documents and idempotent payment", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb,raw_app_meta_data jsonb default '{"provider":"email"}'::jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
    `);
    await db.exec(
      await readFile(
        new URL("../supabase/naijabulk_all.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL("../supabase/1960_upgrade.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      "grant select,insert,update,delete on all tables in schema public to anon,authenticated,service_role;",
    );
    await db.exec(
      await readFile(
        new URL("../supabase/1960_google_auth.sql", import.meta.url),
        "utf8",
      ),
    );
    const buyer = "10000000-0000-0000-0000-000000000001",
      supplier = "20000000-0000-0000-0000-000000000002",
      other = "30000000-0000-0000-0000-000000000003",
      provider = "40000000-0000-0000-0000-000000000004";
    for (const [id, role] of [
      [buyer, "buyer"],
      [supplier, "supplier"],
      [other, "buyer"],
      [provider, "provider"],
    ])
      await db.query(
        "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
        [
          id,
          JSON.stringify({
            role,
            company: role,
            country: "Nigeria",
            provider_type: role === "provider" ? "Freight forwarder" : null,
          }),
        ],
      );
    const act = async (id, role = "authenticated") => {
      await db.exec(`reset role; set role ${role};`);
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
    };
    await act(supplier);
    const listing = (
      await db.query(
        "insert into listings(commodity,title,moq_tons,price_usd_per_ton,unit) values('Garri','White garri',1,10,'pack') returning id",
      )
    ).rows[0].id;
    await db.query("update listings set title='Ijebu garri' where id=$1", [
      listing,
    ]);
    assert.equal(
      (await db.query("select title from listings where id=$1", [listing]))
        .rows[0].title,
      "Ijebu garri",
    );
    await act(buyer);
    assert.equal(
      (
        await db.query(
          "update listings set title='Tampered' where id=$1 returning id",
          [listing],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into rfqs(commodity,quantity_tons,destination) values('Garri',0,'London')",
      ),
    );
    const request = (
      await db.query(
        "insert into rfqs(commodity,quantity_tons,unit,destination) values('Garri',2,'pack','London, UK') returning id",
      )
    ).rows[0].id;
    await act(supplier);
    const quote = (
      await db.query(
        "insert into quotes(rfq_id,price_usd_per_ton,lead_time_days) values($1,10,7) returning id",
        [request],
      )
    ).rows[0].id;
    await db.query("update quotes set price_usd_per_ton=12 where id=$1", [
      quote,
    ]);
    await assert.rejects(
      db.query("update quotes set supplier_id=$1 where id=$2", [other, quote]),
    );
    await act(other);
    await assert.rejects(db.query("select accept_quote($1)", [quote]));
    await act(buyer);
    const order = (await db.query("select accept_quote($1) as id", [quote]))
      .rows[0].id;
    assert.equal(
      (await db.query("select unit from orders where id=$1", [order])).rows[0]
        .unit,
      "pack",
    );
    await assert.rejects(db.query("select accept_quote($1)", [quote]));
    const freight = (
      await db.query(
        "insert into freight_requests(order_id,service,destination,unit) values($1,'Freight forwarder','London','pack') returning id",
        [order],
      )
    ).rows[0].id;
    await act(provider);
    const fq = (
      await db.query(
        "insert into freight_quotes(request_id,price_usd,transit_days) values($1,50,10) returning id",
        [freight],
      )
    ).rows[0].id;
    await act(buyer);
    await db.query("select accept_freight_quote($1)", [fq]);
    assert.equal(
      (
        await db.query("select status from freight_requests where id=$1", [
          freight,
        ])
      ).rows[0].status,
      "assigned",
    );
    await assert.rejects(
      db.query(
        "insert into documents(order_id,doc_type,file_name,file_path) values($1,'Invoice','i.pdf','wrong/i.pdf')",
        [order],
      ),
    );
    await db.query(
      "insert into documents(order_id,doc_type,file_name,file_path) values($1,'Invoice','i.pdf',$2)",
      [order, `${order}/i.pdf`],
    );
    await act(other);
    assert.equal((await db.query("select * from orders")).rows.length, 0);
    assert.equal((await db.query("select * from documents")).rows.length, 0);
    await assert.rejects(db.query("select mark_read($1)", [quote]));
    await act(buyer);
    await assert.rejects(
      db.query(
        "insert into payments(order_id,buyer_id,reference,amount_minor,usd_ngn_rate) values($1,$2,'forged',100,1)",
        [order, buyer],
      ),
    );
    await assert.rejects(db.query("select settle_order_payment('forged','1')"));
    await act("", "service_role");
    await db.query(
      "insert into payments(order_id,buyer_id,reference,amount_minor,usd_ngn_rate) values($1,$2,'1960-test',3600000,1500)",
      [order, buyer],
    );
    await db.exec(
      "select settle_order_payment('1960-test','tx-1'); select settle_order_payment('1960-test','tx-1');",
    );
    assert.equal(
      (await db.query("select payment_status from orders where id=$1", [order]))
        .rows[0].payment_status,
      "paid",
    );
    await act(other);
    assert.equal((await db.query("select * from payments")).rows.length, 0);
    await act(buyer);
    assert.equal((await db.query("select * from payments")).rows.length, 1);
    await db.query(
      "select update_my_profile('Updated buyer','Canada','Importer',null)",
    );
    assert.equal(
      (await db.query("select company from profiles where id=$1", [buyer]))
        .rows[0].company,
      "Updated buyer",
    );
    await db.exec("reset role");
    const googleUser = "50000000-0000-0000-0000-000000000005";
    await db.query(
      "insert into auth.users(id,raw_user_meta_data,raw_app_meta_data) values($1,$2,$3)",
      [
        googleUser,
        JSON.stringify({
          full_name: "Google Member",
          role: "supplier",
          is_admin: true,
        }),
        JSON.stringify({ provider: "google" }),
      ],
    );
    const pending = (
      await db.query("select * from profiles where id=$1", [googleUser])
    ).rows[0];
    assert.equal(pending.company, "Google Member");
    assert.equal(pending.role, "buyer");
    assert.equal(pending.is_admin, false);
    assert.equal(pending.onboarding_complete, false);
    await act(buyer);
    await assert.rejects(
      db.query(
        "select complete_my_onboarding('supplier','Changed role','Nigeria','',null)",
      ),
    );
    await act(googleUser);
    await assert.rejects(
      db.query(
        "select complete_my_onboarding('admin','Bad role','Nigeria','',null)",
      ),
    );
    await assert.rejects(
      db.query(
        "select complete_my_onboarding('provider','Carrier','Nigeria','',null)",
      ),
    );
    await db.query(
      "select complete_my_onboarding('supplier','Nigerian producer','Nigeria','Food producer',null)",
    );
    const complete = (
      await db.query("select * from profiles where id=$1", [googleUser])
    ).rows[0];
    assert.equal(complete.role, "supplier");
    assert.equal(complete.onboarding_complete, true);
    assert.equal(complete.verified, false);
    await assert.rejects(
      db.query(
        "select complete_my_onboarding('buyer','Change again','Nigeria','',null)",
      ),
    );
  } finally {
    await db.close();
  }
});
