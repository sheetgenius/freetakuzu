import assert from "node:assert/strict";
import fs from "node:fs";

const baseUrl = (process.env.BASE_URL || "https://freetakuzu.com").replace(/\/$/, "");
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(baseUrl);
const paths = [
  { request: "/", canonical: "https://freetakuzu.com/" },
  { request: isLocal ? "/strategies.html" : "/strategies", canonical: "https://freetakuzu.com/strategies" },
  { request: isLocal ? "/binairo-online.html" : "/binairo-online", canonical: "https://freetakuzu.com/binairo-online" },
  { request: isLocal ? "/binary-puzzle.html" : "/binary-puzzle", canonical: "https://freetakuzu.com/binary-puzzle" },
  { request: isLocal ? "/takuzu-vs-binairo.html" : "/takuzu-vs-binairo", canonical: "https://freetakuzu.com/takuzu-vs-binairo" },
  { request: isLocal ? "/binairo-gratuit.html" : "/binairo-gratuit", canonical: "https://freetakuzu.com/binairo-gratuit" },
];

console.log(`QA smoke - ${baseUrl}`);

for (const { request, canonical } of paths) {
  const res = await fetch(`${baseUrl}${request}`);
  assert.equal(res.status, 200, `${request} returned ${res.status}`);
  const html = await res.text();
  assert.match(html, /<!DOCTYPE html>/i, `${request} missing doctype`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegex(canonical)}"`), `${request} canonical mismatch`);
  assert.match(html, /application\/ld\+json/i, `${request} missing JSON-LD`);
}

const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
assert.equal(sitemapRes.status, 200, `sitemap returned ${sitemapRes.status}`);
const sitemap = await sitemapRes.text();
for (const { canonical } of paths) {
  assert.ok(sitemap.includes(canonical), `sitemap missing ${canonical}`);
}

for (const file of ["radicchio.json", "ops/manifest.json"]) {
  JSON.parse(fs.readFileSync(file, "utf8"));
}

console.log("QA smoke passed");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
