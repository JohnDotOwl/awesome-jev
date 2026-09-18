export const categories = [
  {
    id: "official",
    title: "Official",
    blurb: "Docs, SDKs, and resources from TypeSafe AI.",
  },
  {
    id: "sdks",
    title: "SDKs and clients",
    blurb: "Community clients for languages without an official SDK.",
  },
  {
    id: "integrations",
    title: "Integrations",
    blurb: "Jev inside frameworks, gateways, databases, and platforms.",
  },
  {
    id: "agents",
    title: "Agent tooling",
    blurb: "Gates, routers, reviewers, MCP servers, and skills for coding agents.",
  },
  {
    id: "browser",
    title: "Browser and computer use",
    blurb: "Browser, desktop, and mobile automation where Jev chooses the action.",
  },
  {
    id: "applications",
    title: "Applications",
    blurb: "Products, CLIs, and pipelines that call Jev.",
  },
  {
    id: "games",
    title: "Games and simulations",
    blurb: "Games and simulations with Jev making the moves.",
  },
  {
    id: "demos",
    title: "Demos and playgrounds",
    blurb: "Live demos and playgrounds.",
  },
  {
    id: "research",
    title: "Benchmarks and research",
    blurb: "Benchmarks, evals, calibration studies, and open replicas.",
  },
  {
    id: "lists",
    title: "Other lists",
    blurb: "Other public directories of Jev projects.",
  },
  {
    id: "articles",
    title: "Articles",
    blurb: "Launch posts, explainers, and independent write-ups.",
  },
];

const NOISE_OWNERS = new Set([
  "jevois",
  "jevajs",
  "goldengnu",
  "ur001",
  "j-east",
  "jevinskie",
]);

const NOISE_RE = /\b(jevois|jeveassets|jevix|jevmachopp|jevons camera|eve-online|eve online)\b/i;

export function isNoise(fullName, description = "") {
  const owner = fullName.split("/")[0].toLowerCase();
  if (NOISE_OWNERS.has(owner)) return true;
  return NOISE_RE.test(`${fullName} ${description}`);
}

export function classify({ repo, name, description = "", homepage = "" }) {
  const blob = `${repo || ""} ${name || ""} ${description} ${homepage}`.toLowerCase();
  if ((repo || "").startsWith("typesafe-ai/")) return "official";
  if (/\bawesome[- ]?(jev|typesafe)\b/.test(blob) || /awesome-(jev|typesafe)/.test(blob)) return "lists";
  if (/\b(benchmark|eval|replica|openjev|jevlike|jev-on-a-laptop|jevbetter|calibration|study)\b/.test(blob)) {
    return "research";
  }
  if (/\b(mario|snake|tetris|doom|chess|drone|pac-?man|pong|2048|minecraft|civ2|game|gomoku|rubik)\b/.test(blob)) {
    return "games";
  }
  if (/\b(browser|computer-use|computer_use|playwright|chrome extension|mobile-jev|puppeteer)\b/.test(blob)) {
    return "browser";
  }
  if (/\b(mcp|router|skill|guard|review|warden|lint|foreman|compaction|winnow|gate|shield|hook)\b/.test(blob)) {
    return "agents";
  }
  if (/\b(sdk|client)\b/.test(blob) || /typesafe-(go|rs|sdk|ai-rs)|jev-go|jevclient|typesafe\.zig/.test(blob)) {
    return "sdks";
  }
  if (/\b(n8n|laravel|rails|home assistant|ha-jev|neo4j|pydantic|langgraph|postgres|pg_|neon|vercel|gateway)\b/.test(blob)) {
    return "integrations";
  }
  if (/\b(playground|demo|showcase)\b/.test(blob)) return "demos";
  return "applications";
}

export function normalizeDescription(d = "") {
  let s = String(d).trim().replace(/\s+/g, " ");
  if (!s) return "";
  s = s[0].toUpperCase() + s.slice(1);
  if (!/[.!?。]$/.test(s)) s += ".";
  return s;
}
