import Link from "next/link";
export const metadata = { title: "Buying & shipping guide" };
export default function Guide() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">YOUR GUIDE TO 1960.COM</p>
        <h1>
          From Nigerian hands
          <br />
          to your home or business.
        </h1>
        <p>
          A clear path for diaspora shoppers, international buyers, Nigerian
          suppliers and logistics partners.
        </p>
      </div>
      <div className="guide-grid">
        <section className="card">
          <h2>01. Find your product</h2>
          <p>
            Search by product, supplier or state. Filter retail packs and bulk
            orders, compare units and minimum quantities, and save a shortlist
            on your device.
          </p>
          <p>
            Sample listings are for exploration and cannot be purchased. Live
            supplier prices are in USD per displayed unit.
          </p>
          <Link href="/#shop">Explore products ↗</Link>
        </section>
        <section className="card">
          <h2>02. Agree your order</h2>
          <p>
            Create a buyer account and submit your quantity, unit, destination
            and specifications. Suppliers respond with prices and lead times.
            Use quotation messages to agree packaging, quality, destination
            eligibility and delivery terms.
          </p>
          <p>
            Accepting a quote creates an order. Check all details before
            accepting.
          </p>
          <Link href="/dashboard">Start a request ↗</Link>
        </section>
        <section className="card">
          <h2>03. Arrange the journey</h2>
          <p>
            From your order, request freight, inspection, warehousing or
            clearing services. Compare provider quotations and assign a
            provider. Freight prices and transit days are provider estimates.
          </p>
          <p>
            Freight, duties, taxes, inspection and insurance are separate from
            the product checkout. Agree these costs with your partners before
            paying for products.
          </p>
          <Link href="/providers">Find logistics partners ↗</Link>
        </section>
        <section className="card">
          <h2>04. Review & pay</h2>
          <p>
            Open checkout from your order. Review your product total and payment
            currency before continuing to the payment provider. Payment
            availability depends on the marketplace operator's configuration.
          </p>
          <p>
            When NGN checkout is enabled, the page shows the operator's USD to
            NGN rate and the exact NGN product amount. Your bank may apply
            conversion fees. Payment status changes only after server
            verification.
          </p>
          <p>
            Payment is collected by the marketplace operator. Automated supplier
            payouts, escrow, refunds and logistics payments are not included.
            Agree fulfilment, cancellation and refund terms with the operator
            and supplier before payment.
          </p>
        </section>
        <section className="card">
          <h2>For suppliers</h2>
          <p>
            Register as a supplier, add business details, and publish products
            with accurate origin, pack sizes, units, minimum quantities and
            photos. Respond to sourcing requests, manage your listings, share
            order documents and post shipment milestones.
          </p>
          <p>
            Only list products produced in Nigeria. Provide the product and
            export documentation relevant to the agreed destination.
            Verification is reviewed separately by marketplace administrators.
          </p>
          <Link href="/login?mode=signup&role=supplier">
            Register your business ↗
          </Link>
        </section>
        <section className="card">
          <h2>Documents & tracking</h2>
          <p>
            Order documents are available to the buyer and supplier on that
            order. Use them for invoices, packing lists and supporting
            certificates.
          </p>
          <p>
            Tracking updates are posted by suppliers and labelled accordingly.
            They are not automatic carrier confirmations. If an order is
            delayed, use the order's quotation conversation to contact the
            supplier.
          </p>
          <Link href="/dashboard">View your orders ↗</Link>
        </section>
      </div>
    </>
  );
}
