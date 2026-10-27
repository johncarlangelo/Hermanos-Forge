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

## 1. General Operating Principles

1. **Verify Before Modifying**: Cross-reference active code patterns before introducing new dependencies, abstractions, or configuration parameters.
2. **Non-Destructive Refactoring**: Never remove working capabilities, comments, or documentation unless explicitly requested or replacing deprecated implementations.
3. **Root Execution**: Always execute build and verification commands from the repository root. Never use `cd` within script invocations.
4. **Clean Verification**: Before declaring any coding task complete, ensure `npm run lint` passes with 0 errors and 0 warnings.
5. **Living Documentation Discipline**:
   - **Update `AGENTS.md` judiciously**: Modify this file *only* when general contributor rules, quality standards, or repository operating workflows evolve. Do not pollute it with transient feature logs or task tracking.
   - **Keep companion docs up-to-date**: Whenever relevant to your changes, proactively update the corresponding companion document:
     - Log, pick up, or close items in [TASKS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/TASKS.md).
     - Record shipped features, PR merges, and version milestones in [PROGRESS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/PROGRESS.md).
     - Document significant architectural choices, trade-offs, and patterns in [DECISIONS.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DECISIONS.md).
     - Document changes to IPC streaming protocols, process management, or packaging in [ARCHITECTURE.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/ARCHITECTURE.md).
     - Document changes to CSS variables, tokens, or component conventions in [DESIGN.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DESIGN.md).

---

## 2. Frontend Engineering Rules (React 19 & Tailwind)

### React 19 Hook Discipline
- **No Synchronous `setState` in Effects**: Never invoke `setState()` synchronously inside `useEffect()` without proper guards or external synchronization. Synchronous calls trigger cascading re-renders and violate `react-hooks/set-state-in-effect`.
- **Dependency Completeness**: Always include all external variables and functions referenced within hooks in their dependency arrays, or memoize handlers via `useCallback` / `useMemo`.
- **State Preservation**: Tab switches and modal navigation must preserve form inputs and progress states using local storage or persistent parent state containers.

### Code Hygiene & Linting
- **Zero Unused Symbols**: No unused imports, variables, or unreferenced parameters (`no-unused-vars`).
- **No Empty Catch Blocks**: Handle or log every caught error meaningfully; never leave empty catch statements (`no-empty`).

### Design & Styling Standards
- **Token Compliance**: Use CSS variables and Tailwind tokens defined in [src/index.css](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/src/index.css) and [DESIGN.md](file:///d:/Comsci%20things/Python/Quick%20Tools%20Project/Hermanos%20Forge/DESIGN.md) (`var(--bg)`, `var(--surface)`, `var(--primary)`, `.glass-panel`, `.btn-primary`, `.input-field`).
- **No Ad-Hoc Utility Clutter**: Prefer reusable component styles and design tokens over arbitrarily nested or competing inline utilities.
- **Dark Mode Primacy**: Maintain the dark-mode aesthetic (`#09090B`) as the primary visual experience.

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

---

## 6. Workspace Skills & Design Intelligence

The following specialized design skills are installed locally inside `.agent/skills/` (gitignored) for AI agent assistance:

1. **`ui-ux-pro-max`**: Design intelligence database covering 50 styles, 21 color palettes, 50 font pairings, 20 charts, and 9 technology stacks.
2. **`impeccable`**: Frontend craft system providing commands for design review, visual audit, polish, micro-animations, typography, and accessibility (`/document`, `/audit`, `/critique`, `/polish`, `/animate`, `/layout`).
3. **`design-taste-frontend` (Taste Skill)**: Anti-slop frontend art direction, browser-based layout auditing, and high-end visual aesthetics.
