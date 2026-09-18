#!/usr/bin/env node
/**
 * Discover Jev/TypeSafe repos on GitHub and merge them into data/projects.json.
 *
 * Same compile loop as popular awesome lists that outgrew hand-edited READMEs:
 * search APIs → structured data → generated README. Descriptions and categories
 * already in the JSON are kept; GitHub only fills blanks and new rows.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { categories, classify, isNoise, normalizeDescription } from "./categories.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = resolve(root, "data/projects.json");
const today = new Date().toISOString().slice(0, 10);

const token =
  process.env.GITHUB_TOKEN ||
  execSync("gh auth token", { encoding: "utf8" }).trim();
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "JohnDotOwl-awesome-jev",
  Authorization: `Bearer ${token}`,
};

const OFFICIAL = [
  {
    name: "TypeSafe AI",
    url: "https://typesafe.ai",
    description: "Company homepage, waitlist, and product overview.",
    category: "official",
  },
  {
    name: "Documentation",
    url: "https://docs.typesafe.ai",
    description: "Introduction, primitives, patterns, cookbooks, HTTP API, and SDK references.",
    category: "official",
  },
  {
    name: "Quick start",
    url: "https://docs.typesafe.ai/introduction/quickstart",
    description: "Shortest path from an API key to a typed decision.",
    category: "official",
  },
  {
    name: "Playground",
    url: "https://console.typesafe.ai/playground",
    description: "Paste a state, add questions, and see typed answers in the browser.",
    category: "official",
  },
  {
    name: "HTTP API",
    url: "https://docs.typesafe.ai/api",
    description: "Request and response contract for POST /v1/systemone.",
    category: "official",
  },
  {
    name: "Primitives",
    url: "https://docs.typesafe.ai/primitives",
    description: "Choice, Score, and Noul: the three question types and what they return.",
    category: "official",
  },
  {
    name: "Launch post",
    url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
    description: "Architecture, RLCD training, pricing, Doom and Wikiracing demos, and FAQ.",
    category: "official",
  },
  {
    name: "Discord",
    url: "https://discord.gg/typesafe",
    description: "Official TypeSafe server.",
    category: "official",
  },
  {
    name: "TypeSafe on X",
    url: "https://x.com/typesafeai",
    description: "Product and research updates.",
    category: "official",
  },
  {
    name: "Jev on Vercel AI Gateway",
    url: "https://vercel.com/ai-gateway/models/jev",
    description: "Hosted typesafe-ai/jev for AI SDK evaluate calls.",
    category: "integrations",
  },
  {
    name: "Vercel AI SDK provider",
    url: "https://ai-sdk.dev/providers/ai-sdk-providers/typesafe-ai",
    description: "@ai-sdk/typesafe-ai plus experimental_evaluate using jev-latest.",
    category: "integrations",
  },
];

async function ghJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} ${res.status} ${await res.text()}`);
  return res.json();
}

async function searchRepos(q, pages = 2) {
  const items = [];
  for (let page = 1; page <= pages; page++) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=100&page=${page}`;
    const body = await ghJson(url);
    items.push(...(body.items || []));
    if ((body.items || []).length < 100) break;
    await new Promise((r) => setTimeout(r, 800));
  }
  return items;
}

async function orgRepos(org) {
  const out = [];
  for (let page = 1; page <= 3; page++) {
    const rows = await ghJson(`https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&type=public`);
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

function toProject(r) {
  const repo = r.full_name;
  const name = OFFICIAL_NAMES[repo] || r.name;
  const description = normalizeDescription(r.description || "");
  return {
    name,
    repo,
    site: r.homepage && /^https?:\/\//.test(r.homepage) && !/github\.com/.test(r.homepage) ? r.homepage : null,
    description,
    category: classify({ repo, name, description, homepage: r.homepage || "" }),
    language: r.language || null,
    stars: r.stargazers_count || 0,
    added: (r.created_at || today).slice(0, 10),
    pushed: (r.pushed_at || "").slice(0, 10) || null,
  };
}

function keyOf(p) {
  return (p.repo || p.url || p.site || p.name).toLowerCase();
}

const existing = existsSync(file)
  ? JSON.parse(readFileSync(file, "utf8"))
  : { updated: today, categories, projects: [] };

const byKey = new Map(existing.projects.map((p) => [keyOf(p), p]));
for (const o of OFFICIAL) {
  const k = keyOf(o);
  if (!byKey.has(k)) {
    byKey.set(k, { stars: 0, language: null, added: today, repo: null, site: null, ...o });
  }
}

const SEED_REPOS = [
  "browser-use/jev-ultrafast",
  "tamaratran/fast-jev-compaction",
  "vinnylarouge/jevlike",
  "jarrodwatts/jev-trader",
  "TheoLeeCJ/openjev",
  "awlevin/typesafe-computer-use",
  "thruwire/foreman",
  "fhshaik/typesafe-mario",
  "ekzhang/openjev-sglang",
  "droidrun/mobile-jev",
];

const OFFICIAL_NAMES = {
  "typesafe-ai/skills": "TypeSafe agent skills",
  "typesafe-ai/typesafe-sdk-js": "TypeSafe JavaScript SDK",
  "typesafe-ai/typesafe-sdk-python": "TypeSafe Python SDK",
  "typesafe-ai/system-one-adapter-python": "System One adapter (Python)",
};

const queries = [
  "jev typesafe",
  "typesafe.ai jev",
  "topic:jev",
  "topic:typesafe-ai",
  "jev in:name typesafe",
  `"system one" jev`,
  "jev-ultrafast",
  "openjev",
  "jevlike",
  "jev-trader",
];

const found = new Map();
for (const q of queries) {
  try {
    const items = await searchRepos(q);
    for (const r of items) found.set(r.full_name.toLowerCase(), r);
    console.log(`${q}: ${items.length}`);
  } catch (err) {
    console.warn(`search failed ${q}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 500));
}

try {
  for (const r of await orgRepos("typesafe-ai")) found.set(r.full_name.toLowerCase(), r);
} catch (err) {
  console.warn(`org typesafe-ai: ${err.message}`);
}

for (const full of SEED_REPOS) {
  try {
    const r = await ghJson(`https://api.github.com/repos/${full}`);
    found.set(r.full_name.toLowerCase(), r);
  } catch (err) {
    console.warn(`seed ${full}: ${err.message}`);
  }
}

let added = 0;
for (const r of found.values()) {
  if (r.fork || r.archived || r.private) continue;
  if (isNoise(r.full_name, r.description || "")) continue;
  const created = (r.created_at || "").slice(0, 10);
  const blob = `${r.full_name} ${r.description || ""}`.toLowerCase();
  const recentJev = created >= "2026-09-14" && (blob.includes("jev") || blob.includes("typesafe"));
  const named = blob.includes("typesafe") || blob.includes("system one");
  if (!recentJev && !named) continue;
  const next = toProject(r);
  if (!next.description && next.stars < 8) continue;
  const k = keyOf(next);
  const prev = byKey.get(k);
  if (!prev) {
    byKey.set(k, next);
    added++;
    continue;
  }
  prev.stars = next.stars;
  prev.language = next.language || prev.language;
  prev.pushed = next.pushed;
  if (!prev.site && next.site) prev.site = next.site;
  if (!prev.description && next.description) prev.description = next.description;
  if (!prev.repo && next.repo) prev.repo = next.repo;
}

const projects = [...byKey.values()].sort(
  (a, b) => (b.stars || 0) - (a.stars || 0) || a.name.localeCompare(b.name)
);

const data = {
  updated: today,
  categories,
  projects,
};
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote ${projects.length} entries (${added} new) to data/projects.json`);
