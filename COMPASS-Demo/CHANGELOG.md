# Changelog

All notable changes to COMPASS-Demo are documented here.

---

## [1.0.0] — 2026-03-14

First stable release. Demo-ready build for the 16 March 2026 client presentation.

### Added
- **Scheduling engine** (Phases 1–3): data loader, maintenance engine, trip assigner, and Gantt orchestrator driven by live Excel data
- **Fleet Overview**: dynamic aircraft status cards with circular progress indicators
- **Flight & Maintenance Schedule**: full Gantt chart with per-tail flight blocks, maintenance blocks, hover popups, and unscheduled flights panel
- **Add Flight flow**: multi-leg flight entry form → confirmation popup → Schedule Impact popup showing shifted/new maintenance blocks and reassigned flights
- **Schedule diff** (`scheduleDiff.ts`): fingerprint-based before/after maintenance matching with positional collision fix
- **Maintenance Overview page**: per-aircraft detail page wired to live scheduler data — status badge, current hours, active maintenance scope table, upcoming maintenance cards with task popup, scheduled flight cards
- **Parts & Equipment page**: tabbed repository with search, filter, and sort
- **FN 9999 demo flight**: guaranteed-unschedulable charter injected for demo narrative
- **141 unit tests** across scheduler, hours accumulation, and schedule diff

### Changed
- `maintenance-overview` page converted from 1600-line static client component to server/client split with live data
- Flight schedule extended to 14 June 2026 (FN 1–134)
- Maintenance horizon aligned to track last flight date

### Fixed
- Past-maintenance guard disabled on demo startup (`new Date(0)`)
- Block ID counters scoped per invocation to prevent duplicate IDs on re-run
- Maintenance/flight clash resolution on scheduler re-runs
- UTC-safe date parsing throughout maintenance overview page
- Missing `tailNumber` param redirects to `/` instead of rendering broken layout
