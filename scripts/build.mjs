#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeDescription } from "./categories.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(resolve(root, "data/projects.json"), "utf8"));
const { categories, projects } = data;

const byCategory = Object.fromEntries(categories.map((c) => [c.id, []]));
for (const p of projects) {
  if (p.gone) continue;
  if (!byCategory[p.category]) throw new Error(`Unknown category "${p.category}" on ${p.name}`);
  byCategory[p.category].push(p);
}
for (const list of Object.values(byCategory)) {
  list.sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999) || (b.stars || 0) - (a.stars || 0) || a.name.localeCompare(b.name)
  );
}

const num = (n) => new Intl.NumberFormat("en-US").format(n || 0);
const slug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/g, "");
const primaryUrl = (p) => p.url || (p.repo ? `https://github.com/${p.repo}` : p.site);

const contents = categories
  .filter((c) => byCategory[c.id].length)
  .map((c) => `- [${c.title}](#${slug(c.title)})`)
  .join("\n");

const sections = categories
  .filter((c) => byCategory[c.id].length)
  .map((c) => {
    const items = byCategory[c.id]
      .map((p) => {
        const extra = [
          p.site && p.repo ? `[site](${p.site})` : null,
          p.post ? `[post](${p.post})` : null,
        ].filter(Boolean);
        const suffix = extra.length ? ` (${extra.join(", ")})` : "";
        const desc = normalizeDescription(p.description) || "Jev project.";
        return `- [${p.name}](${primaryUrl(p)})${suffix} - ${desc}`;
      })
      .join("\n");
    return `## ${c.title}\n\n${c.blurb}\n\n${items}`;
  })
  .join("\n\n");

const listed = projects.filter((p) => !p.gone).length;

const readme = `# Awesome Jev [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> Curated list of projects built on [Jev](https://typesafe.ai), TypeSafe AI's System One model for typed decisions.

Jev takes a state plus typed questions (Choice, Score, Noul) and returns typed answers with calibrated probabilities in one request. It does not generate text. Model id \`jev-latest\`. Docs: [docs.typesafe.ai](https://docs.typesafe.ai). Early access since 2026-09-15.

Not affiliated with TypeSafe AI.

${num(listed)} entries · last refreshed ${data.updated}

## Contents

${contents}

${sections}

## Contributing

Edit \`data/projects.json\` (it drives this README) and run \`npm run build\`. See [CONTRIBUTING.md](CONTRIBUTING.md).
`;

writeFileSync(resolve(root, "README.md"), readme);
console.log(`Built README.md: ${listed} entries.`);
