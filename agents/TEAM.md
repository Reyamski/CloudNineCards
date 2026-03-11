# TEAM.md — Cloud Nine Cards AI Team

## Team Structure

```
CEO (You)
    │
    └── ORCHESTRATOR
            │
            ├── Architect       → store design & layout
            ├── Developer       → code & Shopify API
            ├── Data Engineer   → product data & metafields
            ├── QA Engineer     → review & validate
            └── Docs Engineer   → documentation
```

## Communication Protocol

```
CEO writes directive   → agents/CEO.md
Orchestrator assigns  → inbox/[agent].md
Agent does work       → outbox/[agent].md
QA reviews            → outbox/qa.md
Orchestrator reports  → shared/DECISIONS.md
```

## How to Start a New Session

1. Open `agents/CEO.md` — update the Active Directive
2. Tell Claude: "Read agents/CEO.md and all files in agents/. You are the Orchestrator."
3. Claude will assign tasks to agents and execute

## How to Switch AI (Claude → Codex → Gemini)

1. Open `agents/HANDOFF.md`
2. Tell the new AI: "Read HANDOFF.md and continue from where we left off."

## File Structure

```
agents/
├── CEO.md              ← your dashboard & directives
├── ORCHESTRATOR.md     ← team manager
├── TEAM.md             ← this file
├── architect.md        ← design agent
├── developer.md        ← code agent
├── data-engineer.md    ← data agent
├── qa.md               ← quality agent
└── docs.md             ← documentation agent

shared/
├── CONTEXT.md          ← current project state
└── DECISIONS.md        ← all major decisions

inbox/                  ← tasks assigned to agents
outbox/                 ← completed work from agents

.planning/              ← GSD planning files
```

## Current Sprint

**Goal:** Redesign cloudninecards.ca homepage
**Vibe:** Dark & Epic anime TCG
**Status:** Planning phase
