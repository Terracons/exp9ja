"use client";
import { CAT } from "@/lib/supabase";
import { useState } from "react";

export default function Thumb({
  url,
  commodity,
}: {
  url?: string;
  commodity: string;
}) {
  const [failedUrl, setFailedUrl] = useState("");
  if (url && failedUrl !== url)
    return (
      <img
        src={url}
        alt={commodity}
        className="thumb"
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(url)}
      />
    );
  const [emoji, color] = CAT[commodity] || ["📦", "#456"];
  return (
    <div
      className="thumb ph"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
      aria-hidden="true"
    >
      <span>{emoji}</span>
    </div>
  );
}
