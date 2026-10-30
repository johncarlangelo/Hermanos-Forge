# Hermanos Forge — AI Agent Guidelines & Operating Rules

Welcome to the **Hermanos Forge** codebase. This document outlines general operating rules, engineering standards, quality benchmarks, and workflow conventions for AI agents and human contributors collaborating on this repository.

For technical architecture, design tokens, active tasks, and decision records, refer to the dedicated companion documents:
- 🏗️ **Technical Architecture & IPC Protocol**: [ARCHITECTURE.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/ARCHITECTURE.md)
- 🎨 **Design System & Visual Tokens**: [DESIGN.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DESIGN.md)
- 📋 **Task Board & Issue Backlog**: [TASKS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/TASKS.md)
- 📈 **Milestones & Release Progress**: [PROGRESS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/PROGRESS.md)
- 🧠 **Architectural Decision Records (ADRs)**: [DECISIONS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DECISIONS.md)
- 📖 **User Guide & Development Setup**: [README.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/README.md)

---

## 1. General Operating Principles & Agent Workflow

1. **Persistent Source of Truth**: Future agents must read both `AGENTS.md` and `DESIGN.md` before planning or implementing any UI, component, or architectural changes.
2. **Living Guide Discipline**:
   - Treat `AGENTS.md` as the persistent, living source of truth for repository conventions.
   - Whenever an implementation establishes new conventions, introduces reusable primitives, or changes architectural patterns, **update `AGENTS.md` in that exact same change**.
   - Verify that implementation code and documentation stay in complete agreement.
   - Keep companion docs up-to-date:
     - Log, pick up, or close items in [TASKS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/TASKS.md).
     - Record shipped features, PR merges, and version milestones in [PROGRESS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/PROGRESS.md).
     - Document significant architectural choices and trade-offs in [DECISIONS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DECISIONS.md).
     - Document changes to IPC streaming protocols or process management in [ARCHITECTURE.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/ARCHITECTURE.md).
     - Document visual specs and design tokens in [DESIGN.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DESIGN.md).
3. **Verify Before Modifying**: Cross-reference active code patterns before introducing new dependencies, abstractions, or configuration parameters.
4. **Non-Destructive Refactoring**: Never remove working capabilities, comments, or documentation unless explicitly requested or replacing deprecated implementations.
5. **Root Execution**: Always execute build and verification commands from the repository root. Never use `cd` within script invocations.
6. **Clean Verification**: Before declaring any coding task complete, ensure `npm run lint` passes with 0 errors and 0 warnings.

---

## 2. Frontend Engineering & UI Architecture (React 19 & Tailwind 3.4)

### Path Aliases & Imports
- Use the `@/` path alias for all internal imports (e.g. `@/components/ui/Button`, `@/lib/utils`). Avoid brittle relative path cascades (`../../components`).

### Shared Component Architecture & UI Primitives
- **Location**: All reusable primitives live under `src/components/ui/` (`Button.jsx`, `Input.jsx`, `Select.jsx`, `Dialog.jsx`, `Tabs.jsx`, `Badge.jsx`, `Progress.jsx`, `Tooltip.jsx`, `Card.jsx`, `TitleBar.jsx`).
- **Standard Signature**:
  - Accept standard props: `variant`, `size`, `className`, and forward all valid HTML attributes and refs.
  - Combine classes using the `cn()` utility (`clsx` + `tailwind-merge`) from `@/lib/utils`.
- **Reuse Over Duplication**:
  - Never author raw `<button>`, `<input>`, or custom styled cards directly inside views when a shared primitive exists.
  - Prefer extending an existing shared component (via new variants or props) over creating near-duplicates.
  - If a genuinely new reusable pattern is required, implement it in `src/components/ui/` or `src/components/common/`, adhere to design tokens, and document its conventions here.

### Pages, Screens & View Decomposition
- **View Containers**: Screen views live under `src/components/views/` (e.g. `SingleDownloaderView`, `MassClipView`, `SelectiveDurationView`, `HistoryView`, `SettingsView`).
- **Dialogs & Modals**: Reusable overlays live under `src/components/modals/` (e.g. `CookieWizardModal`, `PlaylistSelectorModal`) and are wrapped in the shared `Dialog` primitive.
- **Decomposition Rule**: Avoid massive monolith files (e.g. >500 lines). `App.jsx` serves as the application shell and navigation coordinator; specific feature workflows must be extracted into dedicated view containers.
- **Form State Preservation**: Each view manages or binds to persistent state. Switching navigation tabs or opening/closing dialogs must **never** wipe form inputs, entered URLs, or active job progress.

### Design System & Visual Token Compliance
- **Token Discipline**: All styling must use the *Obsidian Forge Media Studio* design tokens defined in [src/index.css](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/src/index.css) and [DESIGN.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DESIGN.md):
  - Surfaces: `var(--bg-base)`, `var(--surface-1)`, `var(--surface-2)`, `var(--surface-hover)`
  - Borders: `var(--border-subdued)`, `var(--border-strong)`
  - Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`
  - Accents: `var(--accent-primary)` (violet `#9D4EDD`), `var(--accent-hover)` (`#8B3DD0`), `var(--accent-muted)`, `var(--accent-neon)` (`#C084FC`), `var(--accent-cyan)` (`#00F0FF`)
  - Status: `var(--status-success)` (`#10B981`), `var(--status-warning)` (`#F59E0B`), `var(--status-danger)` (`#EF4444`), `var(--status-info)` (`#00F0FF`)
  - Obsidian Scale (Tailwind `colors.obsidian`): `obsidian-950` (`#09090C`), `obsidian-900` (`#0E0E13`), `obsidian-850` (`#13131A`), `obsidian-800` (`#181824`), `obsidian-750` (`#1F1F2E`), `obsidian-700` (`#28283D`), `obsidian-600` (`#3D3D5C`)
  - Accent Scale (Tailwind `colors.accent`): `accent-violet` (`#9D4EDD`), `accent-amethyst` (`#B5179E`), `accent-purple` (`#A855F7`), `accent-neon` (`#C084FC`), `accent-cyan` (`#00F0FF`), `accent-glow` (`rgba(157, 78, 221, 0.25)`)
  - Glow Shadows: `shadow-glow-violet`, `shadow-glow-amethyst`, `shadow-glow-cyan`, `shadow-inner-glow`, `shadow-window-frame`
- **Theme Primacy**:
  - The application runs strictly on Obsidian Dark UI (`#09090C` canvas, `#0E0E13` surface-1, `#16161F` surface-2). Light mode has been completely removed per user instruction.
- **Typography & Font Stacks**:
  - Display & Headings (`font-heading`): `Space Grotesk`, sans-serif (`font-heading font-bold tracking-tight`).
  - UI labels, prose, and buttons (`font-sans`): `DM Sans`, `Inter`, ui-sans-serif, system-ui, -apple-system, sans-serif.
  - Timestamps, URLs, format tags, timecodes, and logs (`font-mono`): `JetBrains Mono`, `Consolas`, `Menlo`, monospace with tabular numbers (`tabular-nums`).
- **Surfaces, Glows & Depth**:
  - `.surface-panel`: Card/panel with top specular highlight border (`border-t` gradient).
  - `.noise-overlay`: Subtle cybernetic dot grid texture (`background-size: 24px 24px`).
  - `.ambient-glow-purple`: Radial purple ceiling spotlight for application headers and main views.
  - `.studio-ambient-bg`: Dual radial gradient for deep studio atmosphere.
  - `.kbd-hint`: Standardized keyboard shortcut pill with monospace font.
- **Focus & Accessibility**: Every interactive element must have visible, consistent focus rings (`focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none`) and descriptive `aria-label` or `aria-labelledby` attributes.

### State Preservation & Behavior Compatibility
- **Preserve Existing Capabilities**: Never drop or disable existing user workflows (e.g. cookie authentication, playlist selection, MP3 conversion, log viewing, custom output folders).
- **Canonical `localStorage` Keys**: Preserve existing keys and their JSON schemas:
  - `download-history`: Array of completed download records (`id`, `title`, `url`, `type`, `quality`, `outputPath`, `timestamp`, `status`).
  - `global-outputDir`: Saved default destination directory path string.
  - `cookie-browser`: Active browser identifier string for cookie extraction.
  - `cookie-status`: Current cookie synchronization status string.
  - `cookie-sync-date`: ISO timestamp string of last cookie sync.
  - `mass-clips`: Array of clip configuration objects.
  - `theme`: (Deprecated) The app now runs strictly on Obsidian Dark UI.
- **Zero Destructive Resets**: Never auto-wipe inputs, queues, or history on timers, animations, or view switches. User work must be preserved.
- **Strict IPC Contract Preservation**: Never rename, delete, or alter the signature, payload, or event semantics of Electron IPC channels (`window.electronAPI` and `window.stitchAPI`).

### React 19 Hook Discipline
- **No Synchronous `setState` in Effects**: Never invoke `setState()` synchronously inside `useEffect()` without proper guards or external synchronization. Synchronous calls trigger cascading re-renders and violate `react-hooks/set-state-in-effect`.
- **Dependency Completeness**: Always include all external variables and functions referenced within hooks in their dependency arrays, or memoize handlers via `useCallback` / `useMemo`.

### Code Hygiene & Linting
- **Zero Unused Symbols**: No unused imports, variables, or unreferenced parameters (`no-unused-vars`).
- **No Empty Catch Blocks**: Handle or log every caught error meaningfully; never leave empty catch statements (`no-empty`).

---

## 3. Backend Engineering Rules (Python & FFmpeg)

### Stdout & Logging Discipline
- **Strict Prefix Protocol**: The Electron frontend parses Python output via structured line prefixes (`PROGRESS:`, `STATUS:`, `SUCCESS:`, `ERROR:`, `AUTH_ERROR:`, `CLIP:`, etc.). **Do not use arbitrary `print()` statements** in [backend.py](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/backend.py).
- **UTF-8 Stream Forcing**: Both `sys.stdout` and `sys.stderr` must be explicitly reconfigured to `utf-8` on launch to avoid Windows `charmap` encoding crashes when handling Unicode/emoji video titles.

### Windows Subprocess & Terminal Suppression
- **Console Flash Prevention**: All child processes spawned by Python, FFmpeg, or yt-dlp on Windows must include `creationflags = 0x08000000` (`CREATE_NO_WINDOW`) to eliminate flashing command prompt windows.
- **FFmpeg Path Resolution**: Always prioritize the `--ffmpeg-path` explicitly passed by Electron CLI args, with safe fallback to `shutil.which('ffmpeg')`.

### Error Trapping & Interception
- Always wrap yt-dlp extraction with `handle_yt_error(e)` to route YouTube sign-in, bot detection, or age-restriction barriers to `AUTH_ERROR:` before falling back to generic `ERROR:`.

---

## 4. Privacy & Security Rules

- **Local-Only Storage**: All user credentials, cookies, and tokens must remain strictly within local OS storage (`%AppData%\Hermanos Forge\cookies.txt`).
- **Strict Domain Whitelisting**: When importing Netscape cookie files, discard every entry except `.youtube.com` and `.google.com`. Session cookies from other websites must never be persisted.
- **Zero Remote Telemetry**: Never transmit user download histories, media URLs, or authentication data to external tracking endpoints.

---

## 5. Git Workflow & Branch Conventions

### Branch Topology
- **`main`**: Production-ready branch. Releases and installer builds are tagged strictly from `main`.
- **`dev`**: Active integration branch. All feature branches and bug fixes must merge into `dev` first.

### Branch Naming Conventions
- **Features**: `feature/<feature-name>` (e.g. `feature/cookies-from-browser`)
- **Bug Fixes**: `bug-fix/<issue-name>` (e.g. `bug-fix/video-quality-fetch`)
- **Chores & Maintenance**: `chore/<description>`
- **Documentation**: `docs/<description>`

### Pull Requests & Commits
- Always target `dev` when opening PRs.
- Use **Conventional Commits** syntax:
  - `feat:` New functionality
  - `fix:` Bug fix
  - `chore:` Maintenance, dependency updates, lint fixes
  - `docs:` Documentation improvements
  - `perf:` Performance optimizations
  - `refactor:` Code restructuring without functional change
- Verify that `npm run lint` passes and the backend packages cleanly (`npm run package-backend`) before merging.

### Issue Creation Conventions
- **Template Conformance**: When creating GitHub issues via `gh issue create`, strictly follow the schemas in `.github/ISSUE_TEMPLATE/`:
  - `feat`: Follow `feature_request.md` (`## Summary`, `## Problem`, `## Proposed solution`, `## Alternatives considered`, `## Additional context`).
  - `chore(UX)`: Follow `ux_gap.md` (`## Summary`, `## Current behavior`, `## Suggested change`, `## Why this helps`).
  - `bug`: Follow `bug_report.md` (`## Summary`, `## Steps to reproduce`, `## Expected behavior`, `## Actual behavior`, `## Environment`, `## Additional context`).
  - `chore`: Follow `qol_suggestion.md` (`## Summary`, `## Current behavior`, `## Suggested change`, `## Why this helps`).
- **Assignee**: Always automatically assign newly created issues to the repository owner using `--assignee "@me"`.
- **Labels**: Tag issues with standard repository priority and category labels (`Mid Prio` / `Low Prio` / `High Prio`, `enhancement`, `bug`, `ux-gap`, `performance`, `nice to have`).

---

## 6. Workspace Skills & Design Intelligence

The following specialized design skills are installed locally inside `.agent/skills/` (gitignored) for AI agent assistance:

1. **`ui-ux-pro-max`**: Design intelligence database covering 50 styles, 21 color palettes, 50 font pairings, 20 charts, and 9 technology stacks.
2. **`impeccable`**: Frontend craft system providing commands for design review, visual audit, polish, micro-animations, typography, and accessibility (`/document`, `/audit`, `/critique`, `/polish`, `/animate`, `/layout`).
3. **`design-taste-frontend` (Taste Skill)**: Anti-slop frontend art direction, browser-based layout auditing, and high-end visual aesthetics.
4. **`forge-issue` (`/forge-issue`)**: Interactive and template-conforming issue creator enforcing `.github/ISSUE_TEMPLATE/` schemas, `--assignee "@me"`, and repository priority and category labels.
5. **`forge-pr` (`/forge-pr`)**: Standardized PR authoring skill that runs pre-flight verification (`npm run lint`, `npm run build`), targets `dev` by default, enforces Conventional Commits titles, and structures the PR description and verification record.
6. **`forge-branch` (`/forge-branch`)**: Branch workflow skill that ensures a clean working tree, synchronizes remote `dev`, validates naming conventions (`feature/*`, `bug-fix/*`, `chore/*`, `docs/*`), and switches to the new branch.
