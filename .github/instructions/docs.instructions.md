---
name: greendocs-documentation
description: 'Use when editing GreenDocs project docs, onboarding, ADRs, agent customizations, or operational guidance.'
applyTo: 'docs/**/*.md,AGENTIC/**/*.md,README.md,packages/content-schema/README.md,.github/agents/*.md,.github/instructions/*.md,.github/skills/**/SKILL.md'
---

Use `docs/README.md` as the documentation map. Keep one canonical home for each durable fact:
product intent/status in `docs/PRODUCT_BRIEF.md`, current behavior and ownership in
`docs/ARCHITECTURE.md`, operational procedure in `docs/OPERATIONS.md`, and decision rationale in
`docs/adr/`. Keep onboarding short and link to those sources instead of copying them.

Separate implemented behavior from planned capability. Verify code/workflows before asserting
current state. Do not invent a product priority, named owner, support commitment, or tracker item.
Keep time-sensitive reports dated. Update links/indexes with additions and run
`corepack pnpm@12.11.2 lint` to validate local Markdown references.
