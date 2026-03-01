# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal tech blog built with **Docusaurus 3.7.0** (TypeScript/React). Content covers Java, Spring, databases, DevOps, and AI. Site is in Chinese (zh-Hans).

- **URL**: https://felixfly.github.io
- **Repo**: FelixFly/blog
- **Comments**: Giscus (GitHub Discussions)
- **Search**: @easyops-cn/docusaurus-search-local (local full-text, Chinese + English)

## Commands

```bash
npm run start     # Dev server at http://localhost:3000 (hot reload)
npm run build     # Production build → build/ directory
npm run serve     # Preview production build locally
npm run clear     # Clear Docusaurus cache (.docusaurus/)
```

No linting or test scripts are configured.

## Deployment

Manual: `npm run build` then rsync `build/` to `/var/www/blog` on the server. Nginx serves static files with gzip, SPA routing fallback, and asset caching. See `DEPLOY.md` and `nginx.conf` for details.

## Architecture

```
docusaurus.config.ts   # Site config: title, theme, plugins, navbar, Giscus
sidebars.ts            # Auto-generated sidebar from directory structure
src/
  components/Comment.tsx           # Giscus comment widget (theme-aware)
  theme/DocItem/Layout/index.tsx   # Swizzled doc layout — injects Comment below each doc
  pages/index.tsx                  # Custom homepage
  css/custom.css                   # Theme color overrides (green primary)
docs/                              # All content lives here as .md files
  java-basic/    spring/    data-storage/
  middleware/    devops/    ai/    plans/
static/img/                        # Image assets referenced in docs
```

Key pattern: comments are injected into every doc page via the swizzled `DocItem/Layout` component — not per-doc configuration.

## Content Conventions

- Docs are plain Markdown (`.md`) organized by category directories under `docs/`.
- Sidebar categories are defined in `sidebars.ts` mapping directory names to Chinese labels.
- Images go in `static/img/` and are referenced with absolute paths (`/img/filename.png`).
- Blog feature is disabled (`blog: false` in config).
