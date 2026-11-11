export type Listing = {
  id: string;
  title: string;
  commodity: string;
  category?: string;
  sale_type?: string;
  origin_state?: string | null;
  image_url?: string;
  unit?: string;
  demo?: boolean;
  price_usd_per_ton?: number | null;
  moq_tons?: number | null;
  pack_sizes?: string;
  profiles?: { company?: string; verified?: boolean };
};
export type Filters = {
  query: string;
  category: string;
  sale: string;
  origin: string;
  verified: boolean;
  savedOnly: boolean;
  sort: string;
};
export function filterListings(rows: Listing[], f: Filters, saved: string[]) {
  const query = f.query.trim().toLowerCase();
  return rows
    .filter(
      (r) =>
        (!f.category || r.category === f.category) &&
        (!f.sale || (r.sale_type || "bulk") === f.sale) &&
        (!f.origin || r.origin_state === f.origin) &&
        (!f.verified || !!r.profiles?.verified) &&
        (!f.savedOnly || saved.includes(r.id)) &&
        `${r.title} ${r.commodity} ${r.category || ""} ${r.origin_state || ""} ${r.profiles?.company || ""}`
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => {
      if (f.sort === "name") return a.title.localeCompare(b.title);
      if (f.sort.startsWith("price")) {
        if (a.price_usd_per_ton == null)
          return b.price_usd_per_ton == null ? 0 : 1;
        if (b.price_usd_per_ton == null) return -1;
        return (
          (a.price_usd_per_ton - b.price_usd_per_ton) *
          (f.sort === "price-high" ? -1 : 1)
        );
      }
      return 0;
    });
}
