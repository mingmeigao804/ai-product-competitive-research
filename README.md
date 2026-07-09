# AI Product Competitive Research

Claude Code skill for AI product competitive research. Covers AI search, AI assistants, AI companions, AI agents, AI office tools, multimodal AI, vehicle AI, and more.

## What it does

- **Framework mode**: output research plans, templates, or case test designs without web search.
- **Report mode**: real web search → gate check → 4-section report (background, recent actions, strategy comparison, summary) + optional public feedback.
- **Case testing mode**: co-design real-world prompt comparison tests with scenario pools and recording templates.

## Design

**Hybrid enforcement: prompt rules + gate script.** Pure prompts can't reliably prevent the model from fabricating reports when sources are scarce. `scripts/research-gate.js` (zero-dependency Node.js) enforces two hard gates:

1. **Scope gate** — no research before user confirms scope.
2. **Source gate** — each competitor needs ≥3 sources / ≥2 types. If not met, the only allowed output is a gap report (not a padded fake report).

## Requirements

- Node.js (for the gate script)
- `feishu-mcp-pro` MCP server (optional, only when writing to Feishu docs)

## File structure

```
├── SKILL.md                          # Main entry point
├── scripts/
│   ├── research-gate.js              # Gate enforcement script
│   └── research-state-template.md    # State file template
├── references/
│   ├── workflow.md                   # Full phase-by-phase workflow
│   ├── source-research-playbook.md   # Search rules, channel strategy, source table spec
│   ├── sources-registry.md           # Per-product authoritative source URLs
│   ├── gap-report.md                 # Template for insufficient-source output
│   ├── public-feedback-analysis.md   # Social media feedback analysis method
│   ├── optional-case-testing.md      # Optional deep-dive case testing module
│   ├── report-templates.md           # Report and process markdown templates
│   └── feishu-report-writing.md      # Feishu doc writing guide
├── examples/
│   ├── ai-search.md
│   ├── ai-companion.md
│   └── ai-agent.md
└── evals/
    └── evals.json                    # 7 evaluation cases
```

## Usage

1. Copy this skill into your Claude Code skills directory.
2. Ensure Node.js is available in your environment.
3. For Feishu output, connect `feishu-mcp-pro` MCP server.

Trigger the skill with phrases like:
- "调研/对比/分析 XX 竞品"
- "XX 产品最近有什么新功能"
- "比较 A/B/C 在 XX 上的差异"
- "做一版 XX 方向的竞品分析报告"