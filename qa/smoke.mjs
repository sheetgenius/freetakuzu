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

let rootHtml = "";
let strategiesHtml = "";
let binairoOnlineHtml = "";

for (const { request, canonical } of paths) {
  const res = await fetch(`${baseUrl}${request}`);
  assert.equal(res.status, 200, `${request} returned ${res.status}`);
  const html = await res.text();
  assert.match(html, /<!DOCTYPE html>/i, `${request} missing doctype`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegex(canonical)}"`), `${request} canonical mismatch`);
  assert.match(html, /application\/ld\+json/i, `${request} missing JSON-LD`);
  assert.match(html, /href="https:\/\/bitterdesk\.com\/"/, `${request} support destination mismatch`);
  if (request === "/") rootHtml = html;
  if (canonical.endsWith("/strategies")) strategiesHtml = html;
  if (canonical.endsWith("/binairo-online")) binairoOnlineHtml = html;
}

assert.match(rootHtml, /<h1 id="page-title">Fill the grid\. Keep every line unique\.<\/h1>/, "root missing clear game promise");
assert.match(rootHtml, /@media \(prefers-color-scheme: dark\)/, "root missing dark color scheme");
assert.match(rootHtml, /aria-label="8 by 8 Takuzu grid" aria-busy="true"/, "root missing accessible game state");
assert.match(rootHtml, /https:\/\/company\.sheetgenius\.com\//, "root missing SheetGenius attribution");
assert.doesNotMatch(rootHtml, /More Free Tools/, "root includes unrelated tool directory");
assert.doesNotMatch(rootHtml, /sends nothing to any server/i, "root includes an overbroad privacy claim");
assert.doesNotMatch(binairoOnlineHtml, /no server round trip/i, "guide includes an overbroad network claim");
assert.match(strategiesHtml, /Every puzzle generated on this site is checked for a unique solution/, "strategies missing scoped generator guarantee");
assert.doesNotMatch(strategiesHtml, /solve any (?:Binairo|Takuzu|binary) puzzle/i, "strategies overclaim universal coverage");
assert.doesNotMatch(strategiesHtml, /sufficient for any valid puzzle/i, "strategies overclaim universal sufficiency");
assert.doesNotMatch(strategiesHtml, /you will always find a way forward/i, "strategies include an unscoped absolute");

const agentInstructions = fs.readFileSync("AGENTS.md", "utf8");
assert.doesNotMatch(agentInstructions, /no backend, no data stored/i, "AGENTS includes an overbroad data claim");
assert.match(agentInstructions, /Public pages use Google Analytics/, "AGENTS omits analytics boundary");

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
