# Phase 1: Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Install driver.js, create dark mode + RTL CSS overrides, set up Jotai persistence atoms, establish onboarding project structure (src/components/onboarding/), define tour steps in a pure data file, and add data-tour attributes to existing components.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation decisions for this phase are at Claude's discretion:
- Popover visual styling (colors, borders, shape) in light and dark modes — match existing app design tokens
- Persian copy for tour step titles/descriptions and carousel slide headlines — write concise, natural Persian
- Target elements, order, and mobile filtering — follow research recommendations (7 elements across 5 files)
- Persistence atom naming and versioning — follow existing Jotai patterns in the codebase
- CSS override specifics for RTL layout — follow research findings, test visually
- Project structure within src/components/onboarding/ — follow research architecture recommendations

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow research recommendations from .planning/research/.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-19*
