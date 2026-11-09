// Places each uniquely named page file at its route as page.tsx, so you never rename anything.
// Run from the project folder (the one with package.json):  node setup-pages.mjs
import fs from "node:fs";
import path from "node:path";

const map = {
  "home-page.tsx": "app/page.tsx",
  "login-page.tsx": "app/login/page.tsx",
  "dashboard-page.tsx": "app/dashboard/page.tsx",
  "admin-page.tsx": "app/admin/page.tsx",
  "track-page.tsx": "app/track/page.tsx",
  "messages-page.tsx": "app/messages/page.tsx",
  "inbox-page.tsx": "app/inbox/page.tsx",
  "providers-page.tsx": "app/providers/page.tsx",
  "suppliers-page.tsx": "app/suppliers/page.tsx",
  "freight-page.tsx": "app/freight/page.tsx",
  "docs-page.tsx": "app/docs/page.tsx",
};

const skip = new Set(["node_modules", ".next", ".git"]);
function find(name, dir = ".") {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const hit = find(name, p);
      if (hit) return hit;
    } else if (e.name === name) return p;
  }
  return null;
}

let placed = 0;
for (const [name, target] of Object.entries(map)) {
  const src = find(name);
  if (!src) { console.log(`not found (skipped): ${name}`); continue; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(src, target);
  if (path.resolve(src) !== path.resolve(target)) fs.unlinkSync(src);
  console.log(`${name}  ->  ${target}`);
  placed++;
}
console.log(`\nDone. ${placed} page files placed. Now run: npm run dev`);
