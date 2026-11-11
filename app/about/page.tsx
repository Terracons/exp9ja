import Link from "next/link";
export const metadata = { title: "About us" };
export default function About() {
  return (
    <>
      <section className="independence-hero">
        <div className="hero-copy">
          <p className="eyebrow">ABOUT 1960.COM</p>
          <h1>
            Our roots.
            <br />
            Our <em>possibilities.</em>
          </h1>
          <p className="hero-description">
            A marketplace for products made in Nigeria, connecting our farmers,
            makers and businesses with international buyers and the diaspora.
          </p>
          <Link href="/#shop" className="btn">
            Explore the marketplace ↗
          </Link>
        </div>
        <div
          className="heritage-art"
          role="img"
          aria-label="Commemorative artwork for Nigeria's independence in 1960"
        >
          <div className="art-top">
            <span>NIGERIA / EST. 1960</span>
            <span>01 OCT</span>
          </div>
          <div className="art-number">
            19
            <br />
            <span>60</span>
          </div>
          <div className="art-bottom">
            <span>OUR INDEPENDENCE. OUR ENTERPRISE.</span>
            <span>↗</span>
          </div>
        </div>
      </section>
      <section className="heritage-section">
        <div>
          <p className="eyebrow">MORE THAN A NAME. A BEGINNING.</p>
          <h2>
            October first.
            <br />
            <em>Forever forward.</em>
          </h2>
          <p>
            On 1 October 1960, Nigeria became independent. Our name honours that
            beginning. Our marketplace champions the enterprise, creativity and
            work that carry the story forward.
          </p>
          <p className="heritage-date">01 / 10 / 1960</p>
        </div>
        <div className="heritage-statement">
          <h3>
            Made here.
            <br />
            Shared with the world.
          </h3>
          <p>
            For a diaspora buyer, it might be an ingredient that tastes like
            home. For an importer, it might be a connection with a new producer.
            For a Nigerian business, it is a chance to reach a wider market.
          </p>
          <p>
            We bring product discovery, supplier quotations, messaging and
            logistics coordination together to help those connections happen.
          </p>
        </div>
      </section>
      <section className="trade-section">
        <div>
          <p className="eyebrow">A MARKETPLACE BUILT ON CONNECTION</p>
          <h2>
            From discovery
            <br />
            to your next order.
          </h2>
          <p>
            Explore Nigerian products, agree specifications directly with
            suppliers, and plan the journey to your destination.
          </p>
          <Link href="/guide" className="text-link">
            How buying and shipping work ↗
          </Link>
        </div>
        <ol className="trade-steps">
          <li>
            <span>01</span>
            <div>
              <h3>For buyers</h3>
              <p>
                Find retail packs or bulk commodities. Compare quotations and
                connect with producers.
              </p>
              <Link href="/#shop">Discover products ↗</Link>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>For Nigerian businesses</h3>
              <p>
                Showcase what you produce, respond to enquiries and build
                international trade connections.
              </p>
              <Link href="/login?mode=signup&role=supplier">
                Become a supplier ↗
              </Link>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>For logistics partners</h3>
              <p>
                Connect with buyers and suppliers who need freight, inspection
                and trade support.
              </p>
              <Link href="/login?mode=signup&role=provider">
                Join as a logistics partner ↗
              </Link>
            </div>
          </li>
        </ol>
      </section>
    </>
  );
}
