# Contributing

The list is generated. Do not edit `README.md` by hand.

Source of truth is `data/projects.json`. That is the same split used by lists like Awesome Selfhosted (YAML/JSON in, Markdown out) and by other Jev directories that harvest GitHub then refresh stars.

## Add a project

1. Fork and add an object to the `projects` array in `data/projects.json`:

```json
{
  "name": "jev-router",
  "repo": "owner/jev-router",
  "site": null,
  "description": "Route each Claude Code turn to the cheapest capable model.",
  "category": "agents",
  "language": "JavaScript",
  "stars": 0,
  "added": "2026-09-18"
}
```

- `repo` is `owner/name` on GitHub, or omit/`null` for a site-only entry.
- `site` is a live URL or `null`.
- `url` is for articles with neither a repo nor a product site.
- `category` must be one of the `id` values in the `categories` array.
- Leave `stars` at `0`. `npm run refresh` fills stars and language from the GitHub API.

2. Run `npm run build` so the README updates.

3. Open a pull request. One project per PR.

## What gets listed

- It actually calls Jev or the TypeSafe System One API, or is a faithful open replica, benchmark, or write-up about it.
- It is public.
- The description is one sentence, what it does, where Jev fits. Capital letter, ends with a period.
- Not a fork of something already listed unless it adds something new.

Empty repos, placeholder READMEs, and unrelated "Jev" names (Jevois, jEveAssets, Jevix) are out.

## Format

Follow the [Awesome guidelines](https://github.com/sindresorhus/awesome/blob/main/pull_request_template.md):

- `- [Name](url) - Description.`
- Description starts uppercase and ends with a period.
- No marketing blurbs.

## Maintenance

```bash
npm run harvest   # GitHub search → merge new repos into data/projects.json
npm run refresh   # update stars, language, homepages
npm run build     # regenerate README.md
```

Set `GITHUB_TOKEN` (or use `gh auth`) so search is not rate-limited.
