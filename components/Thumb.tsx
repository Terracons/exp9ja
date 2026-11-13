"use client";
import { CAT, categoryOf } from "@/lib/supabase";
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
  const [, color] = CAT[commodity] || ["", "#456"];
  const category = categoryOf(commodity);
  const fabric = category === "Fashion and Textiles";
  const jar = category === "Beauty and Natural Products";
  return (
    <div
      className="thumb product-illustration"
      role="img"
      aria-label={`${commodity}, product illustration`}
      style={{ background: `${color}15` }}
    >
      <svg viewBox="0 0 280 240" aria-hidden="true" focusable="false">
        <ellipse cx="140" cy="209" rx="76" ry="11" fill={color} opacity=".14" />
        {fabric ? (
          <g transform="rotate(-12 140 120)">
            <rect x="67" y="49" width="143" height="155" rx="5" fill={color} />
            {[0, 1, 2, 3].map((i) => (
              <g
                key={i}
                transform={`translate(0 ${i * 35})`}
                stroke="#fff9e7"
                fill="none"
                strokeWidth="3"
              >
                <path d="M75 61l22 20 22-20 22 20 22-20 22 20 18-20" />
                <path
                  d="M75 71l22 20 22-20 22 20 22-20 22 20 18-20"
                  opacity=".45"
                />
              </g>
            ))}
            <path d="M70 198h136" stroke="#fff9e7" strokeWidth="6" />
          </g>
        ) : jar ? (
          <g>
            <rect
              x="87"
              y="77"
              width="106"
              height="124"
              rx="22"
              fill="#e4c990"
            />
            <rect x="84" y="63" width="112" height="32" rx="7" fill={color} />
            <rect x="89" y="117" width="102" height="59" fill="#fffaf0" />
            <path
              d="M131 147q-17-27 6-31 17 20-6 31m0 0q28-30 32-8-8 16-32 8"
              fill={color}
            />
          </g>
        ) : (
          <g>
            <path
              d="M91 39h98l-6 37 21 107q3 21-18 23H94q-21-2-18-23L97 76z"
              fill="#d9bc88"
            />
            <path d="M91 39h98l-3 17H94z" fill={color} />
            <path d="M97 76h86" stroke="#b09364" strokeWidth="3" />
            <path d="M87 112h106l9 69H78z" fill="#fffaf0" />
            <path
              d="M140 166v-39m0 9q-22-22-20-3 3 13 20 13m0-2q21-26 23-7-1 14-23 17"
              stroke={color}
              strokeWidth="3"
              fill="none"
            />
            <path d="M97 190h86" stroke={color} strokeWidth="3" opacity=".6" />
          </g>
        )}
        <text
          x="140"
          y="228"
          textAnchor="middle"
          fill="#455743"
          fontSize="10"
          letterSpacing="2"
        >
          {commodity.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
