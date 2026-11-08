import { CAT } from "@/lib/supabase";

export default function Thumb({ url, commodity }: { url?: string; commodity: string }) {
  if (url) return <img src={url} alt={commodity} className="thumb" loading="lazy" />;
  const [emoji, color] = CAT[commodity] || ["📦", "#456"];
  return <div className="thumb ph" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }} aria-hidden="true"><span>{emoji}</span></div>;
}
