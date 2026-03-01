# Docusaurus Migration Design

## Goal

Convert the existing blog repository (44 Markdown articles) into a Docusaurus site with both documentation and blog sections.

## Approach

**In-place transformation**: Initialize Docusaurus in the current repo, reorganize articles into `docs/` (categorized knowledge base) and `blog/` (timeline view).

## Document Categories

| Category | Directory | Content | Count |
|----------|-----------|---------|-------|
| Java Basic | `docs/java-basic/` | Java Core, Java 8, JVM GC, Concurrency, Design Patterns | 6 |
| Spring | `docs/spring/` | Spring IOC/AOP/Bean, SpringBoot, SpringCloud | 17 |
| Data Storage | `docs/data-storage/` | MySQL/InnoDB, Redis, ElasticSearch | 10 |
| Middleware | `docs/middleware/` | Dubbo, CAS/Shiro, XXL-JOB | 4 |
| DevOps | `docs/devops/` | Docker, Nginx, Linux, Git, Jenkins | 7 |

## Project Structure

```
blog/
├── docusaurus.config.ts
├── package.json
├── sidebars.ts
├── src/pages/           # Custom homepage
├── docs/
│   ├── java-basic/
│   ├── spring/
│   ├── data-storage/
│   ├── middleware/
│   └── devops/
├── blog/                # All articles as blog posts (timeline)
└── static/img/          # Image assets
```

## Article Processing

- Preserve original frontmatter (title, author, date, tags)
- Add `sidebar_position` for docs ordering
- Blog entries use original date for chronological sorting
- Images migrated to doc-relative paths or static/img/

## Deployment

Local build only (no CI/CD for now).
