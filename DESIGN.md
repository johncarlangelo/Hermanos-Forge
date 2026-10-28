# Hermanos Forge --- Design Specification

**Document status:** Proposed design specification\
**Design direction:** Precision Studio\
**Application:** Hermanos Forge desktop application\
**Platform focus:** Windows desktop (Electron)\
**Implementation status:** Not yet implemented\
**Source of truth:** This document defines the intended visual system
and UI behavior for the redesign. Existing source code and the audit
report remain authoritative for current implementation details.

------------------------------------------------------------------------

## 1. Purpose and Scope

Hermanos Forge is a desktop media utility for downloading media,
converting local MP4 files to MP3, downloading selected video segments,
processing multiple clip URLs, stitching clips, reviewing download
history, and configuring application settings and browser-cookie
authentication.

The redesign should make Forge feel like a deliberate, premium desktop
workbench rather than a collection of loosely related utility screens.

The design must improve:

-   Visual hierarchy and consistency.
-   Workflow clarity and discoverability.
-   Use of the available desktop viewport.
-   Feedback during inspection, downloads, conversions, stitching, and
    errors.
-   Accessibility, keyboard use, and focus behavior.
-   Dark and light theme quality.
-   The cohesion of the main window, dialogs, and developer logs window.

### In scope

-   Application shell, navigation, title bar, and workspace layout.
-   Design tokens, themes, typography, spacing, borders, radii, and
    elevation.
-   Shared UI primitives and consistent interaction states.
-   Existing downloader, mass-clip, selective-duration, history,
    settings, and diagnostics views.
-   Existing dialogs and the auxiliary logs window.
-   Visual treatment of loading, progress, empty, success, warning, and
    error states.
-   UI-level usability improvements specifically approved in this
    document.

### Out of scope unless separately approved

-   Replacing or rewriting the Python backend.
-   Changing yt-dlp, FFmpeg, cookie extraction, or media-processing
    logic.
-   Changing Electron IPC channel names, method signatures, payloads,
    event semantics, or lifecycle.
-   Introducing unrelated new product features.
-   Changing persisted data formats or existing localStorage keys.
-   Automatically clearing or rewriting user inputs, history, or queued
    work as part of a visual refresh.
-   Migrating the project to TypeScript or Tailwind CSS v4.
-   Purchasing a UI kit or introducing paid dependencies.

**Core principle:** Improve the interface around existing capabilities.
Do not break or silently change the behavior that makes those
capabilities work.

------------------------------------------------------------------------

## 2. Product and Design Principles

### 2.1 Precision Studio

Forge should communicate focus, control, and technical reliability. Its
interface should be understated and purposeful.

The visual language uses:

-   Graphite and slate surfaces rather than large blurred glass panels.
-   Thin, consistent borders to define regions.
-   A restrained mint/teal accent for primary actions, selected states,
    and progress.
-   Compact, legible typography.
-   Consistent rectangular controls with modest corner radii.
-   Clear status labels and persistent feedback.
-   Small, purposeful animations rather than decorative movement.

### 2.2 Utility before decoration

Every screen should make its main task and next action obvious. Do not
add large hero sections, fake dashboard metrics, decorative charts, or
nested cards without a concrete usability purpose.

### 2.3 Clear hierarchy

Each view should have a clear page title, concise supporting context
where useful, a recognizable primary action, and secondary actions that
do not compete with it.

### 2.4 Honest feedback

Long-running operations must clearly communicate what is happening.
Progress, errors, cancellation, and completion should reflect real
application state rather than decorative timers or guessed progress.

### 2.5 Preserve user work

Never clear URLs, queue rows, clip ranges, or other user-entered work
merely because an animation finished or a timeout elapsed. Destructive
actions require an explicit action and appropriate confirmation.

### 2.6 Consistency without forcing sameness

Shared components should look and behave consistently. Specialized
controls---especially the selective-duration timeline---may retain
purpose-built layouts when a generic component would reduce clarity or
precision.

------------------------------------------------------------------------

## 3. Confirmed Design Decisions

The following decisions have been confirmed by the product owner:

1.  **Window frame:** Use a custom frameless Electron window with
    application-owned title-bar controls.
2.  **Playlist detection:** Detect and communicate playlist URLs inline.
    Provide an explicit action to open the playlist-selection dialog; do
    not automatically interrupt the user with the dialog merely because
    a playlist is detected.
3.  **Fresh-install theme:** Default to dark mode.
4.  **Theme support:** Provide both dark and light themes.
5.  **Accent:** Mint/teal.
6.  **Density:** Balanced desktop density.
7.  **Branding:** Subtle, not dominant.
8.  **Design direction:** Precision Studio.
9.  **Component direction:** Prefer source-owned, customizable React
    components; shadcn/ui-compatible patterns are the preferred
    foundation, subject to a compatibility check before installation.
10. **Implementation language and styling:** Keep the existing
    JavaScript/JSX and Tailwind CSS 3.4 approach unless a separate
    decision authorizes a migration.

A future system-theme option may be considered, but it is not required
for the first redesign. The initial theme preference should be dark on
fresh installs, with an explicit way to switch themes.

------------------------------------------------------------------------

## 4. Technical Constraints and Integration Boundaries

The repository audit identifies React 19, Vite 8, Tailwind CSS 3.4,
Electron, a Python backend, FFmpeg, yt-dlp-related tooling, Lucide
React, Framer Motion, and react-hot-toast.

Verify exact versions and current implementation details in the
repository before implementation.

### 4.1 Contracts that must remain intact

The UI redesign must preserve existing IPC methods, channel names,
arguments, return values, and event semantics. In particular, preserve
the existing contracts for:

-   Single MP3 and MP4 downloads.
-   Clip downloads and cancellation.
-   URL inspection and format retrieval.
-   Video metadata retrieval.
-   Local MP4-to-MP3 conversion.
-   Mass clip stitching and cancellation.
-   Cookie extraction and cookie-file import.
-   Directory and file selection.
-   Opening a file location.
-   Unique output-folder creation.
-   System-status checks.
-   Opening the developer logs window.
-   External URL opening.
-   Download progress and status listeners.
-   Authentication errors.
-   Per-clip and stitch status, success, and error listeners.

The current bridge is exposed through the Electron preload layer,
including `window.electronAPI` and `window.stitchAPI`. Do not bypass
this bridge from React or introduce direct Node.js access into the
renderer.

Do not rename, remove, consolidate, or change these contracts as part of
UI work.

### 4.2 Persisted state

Preserve existing localStorage keys and their current data formats
unless a separate migration is explicitly planned and approved:

-   `download-history`
-   `global-outputDir`
-   `cookie-browser`
-   `cookie-status`
-   `cookie-sync-date`
-   `mass-clips`
-   `theme`

Do not silently reset history, output preferences, authentication
status, queued clips, or the selected theme.

### 4.3 Keep the logs window functional

The developer logs window should visually belong to Forge, but must
remain useful for inspecting technical output. Use a theme-aware console
surface and readable monospace text. Do not remove log content, change
its data source, or introduce decorative formatting that makes logs
harder to read.

### 4.4 Dependency policy

Before adding or configuring UI dependencies:

1.  Inspect the existing package manifest, lockfile, and configuration.
2.  Confirm compatibility with React 19, Vite 8, JavaScript/JSX, and
    Tailwind CSS 3.4.
3.  Avoid unnecessary framework migrations.
4.  Reuse existing Lucide React, Framer Motion, and toast infrastructure
    where appropriate.
5.  Add only dependencies that support an identified need.

The proposed shadcn/ui approach may require alias and utility
configuration. Treat those changes as implementation tasks, not
assumptions that have already been completed. Do not run an automated
setup that overwrites existing project styles without reviewing the
diff.

------------------------------------------------------------------------

## 5. Visual Foundation

### 5.1 Color system

Use semantic CSS variables so components refer to a role rather than
hard-coded colors. The values below are the proposed starting palette;
check contrast and rendered appearance before finalizing.

#### Dark theme --- default

  -----------------------------------------------------------------------------
  Token                   Proposed value                Purpose
  ----------------------- ----------------------------- -----------------------
  `--bg-base`             `#0D1117`                     Main application canvas

  `--surface-1`           `#161B22`                     Sidebar, title-bar
                                                        region, primary
                                                        surfaces

  `--surface-2`           `#21262D`                     Inputs, secondary
                                                        panels, item surfaces

  `--surface-hover`       `#30363D`                     Hovered interactive
                                                        surfaces

  `--border-subdued`      `rgba(240, 246, 252, 0.10)`   Dividers and
                                                        low-emphasis boundaries

  `--border-strong`       `rgba(240, 246, 252, 0.18)`   Inputs and prominent
                                                        boundaries

  `--text-primary`        `#F0F6FC`                     Main content and
                                                        headings

  `--text-secondary`      `#8B949E`                     Supporting text and
                                                        metadata

  `--accent-primary`      `#14B8A6`                     Primary action,
                                                        selected controls,
                                                        progress

  `--accent-hover`        `#0D9488`                     Hover/pressed accent
                                                        state

  `--accent-muted`        `rgba(20, 184, 166, 0.12)`    Subtle selection and
                                                        accent backgrounds

  `--status-success`      `#10B981`                     Successful completion
                                                        and healthy status

  `--status-warning`      `#F59E0B`                     Warnings and
                                                        attention-needed states

  `--status-danger`       `#EF4444`                     Errors and destructive
                                                        actions

  `--status-info`         `#38BDF8`                     Informational states
  -----------------------------------------------------------------------------

#### Light theme

  ----------------------------------------------------------------------------
  Token                   Proposed value               Purpose
  ----------------------- ---------------------------- -----------------------
  `--bg-base`             `#F8FAFC`                    Main application canvas

  `--surface-1`           `#FFFFFF`                    Sidebar and primary
                                                       surfaces

  `--surface-2`           `#F1F5F9`                    Inputs and secondary
                                                       panels

  `--surface-hover`       `#E2E8F0`                    Hovered interactive
                                                       surfaces

  `--border-subdued`      `#E2E8F0`                    Dividers and
                                                       low-emphasis boundaries

  `--border-strong`       `#CBD5E1`                    Inputs and prominent
                                                       boundaries

  `--text-primary`        `#0F172A`                    Main content and
                                                       headings

  `--text-secondary`      `#64748B`                    Supporting text and
                                                       metadata

  `--accent-primary`      `#0D9488`                    Primary action,
                                                       selected controls,
                                                       progress

  `--accent-hover`        `#0F766E`                    Hover/pressed accent
                                                       state

  `--accent-muted`        `rgba(13, 148, 136, 0.10)`   Subtle selection and
                                                       accent backgrounds

  `--status-success`      `#047857`                    Successful completion
                                                       and healthy status

  `--status-warning`      `#B45309`                    Warnings and
                                                       attention-needed states

  `--status-danger`       `#B91C1C`                    Errors and destructive
                                                       actions

  `--status-info`         `#0369A1`                    Informational states
  ----------------------------------------------------------------------------

Status colors in each theme must be checked against the background they
appear on. Do not use color as the only way to communicate a state;
include text and/or an icon.

### 5.2 Accent usage

Mint/teal should be recognizable but restrained. Use it for:

-   The main action on a screen.
-   Active navigation and selected controls.
-   Focus indicators when appropriate.
-   Progress fills and positive selection feedback.

Do not use the accent for every icon, every border, large decorative
gradients, or non-interactive ornament.

### 5.3 Typography

Use the existing Inter font if it is already loaded successfully. Avoid
adding a font dependency without a clear need.

  -------------------------------------------------------------------------
  Role                            Size               Weight Typical use
  --------------- -------------------- -------------------- ---------------
  Application                     15px                  700 App name and
  brand/title                                               top-level
                                                            identity

  View title                  20--24px             600--700 Main screen
                                                            heading

  Section heading             14--16px                  600 Panel and
                                                            section titles

  Body and                    13--14px             400--500 Inputs, labels,
  controls                                                  options,
                                                            descriptions

  Metadata                    11--12px             400--500 Timestamps,
                                                            secondary
                                                            labels, badges

  Technical                       12px             400--500 Timecodes, file
  monospace                                                 paths, logs,
                                                            technical
                                                            identifiers
  -------------------------------------------------------------------------

Use clear hierarchy rather than making every heading large. Technical
values such as timecodes and paths should use a legible monospace font
stack. Avoid low-contrast microtext.

### 5.4 Spacing and density

Use a consistent spacing scale based on 4px increments. Typical values:

-   4px: icon-to-label micro-spacing.
-   8px: compact control internals.
-   12px: related controls and metadata.
-   16px: standard component gaps and panel padding.
-   20--24px: section spacing.
-   24--32px: separation between major page regions.

The interface should be comfortable at the default 900 × 700 window
size. Avoid oversized padding that pushes primary actions off-screen.
Allow scrolling when content genuinely requires it, but keep the most
important action and essential controls visible whenever practical.

### 5.5 Radius and elevation

Use consistent, modest radii:

-   **8px:** Main panels, cards, and dialogs.
-   **6px:** Inputs, buttons, selects, and menus.
-   **4px:** Badges, small tags, and compact indicators.

Use thin borders as the main method of defining surfaces. Reserve
shadows for menus, popovers, and dialogs that need to sit above other
content. Avoid heavy blur, glowing borders, and layered glass effects.

------------------------------------------------------------------------

## 6. Application Shell and Frameless Window

### 6.1 Overall layout

Use a compact left navigation sidebar and a flexible main workspace. The
shell should feel like a focused desktop utility, not a web dashboard.

Recommended structure:

1.  Custom title-bar region.
2.  Compact sidebar with app identity and navigation.
3.  Main workspace with page heading, relevant actions, and the active
    tool.
4.  Optional contextual footer/status region only where it communicates
    useful real application state.

The layout must remain usable at the existing 900 × 700 default window
size. Do not assume that every user runs Forge maximized.

### 6.2 Custom title bar requirements

The frameless window is an explicit product decision and therefore
requires deliberate implementation and testing.

-   Preserve the existing Electron security model and preload bridge.
-   Provide a clearly identifiable draggable title-bar region.
-   Implement minimize, maximize/restore, and close controls using the
    supported Electron window-control approach.
-   Ensure buttons and interactive elements are excluded from the
    draggable region.
-   Give controls visible hover, pressed, and keyboard-focus states.
-   Keep window controls discoverable and sized for reliable
    interaction.
-   Ensure the close action follows the application's intended close
    behavior; do not introduce surprising confirmation prompts or
    silently terminate active work.
-   Verify maximize/restore behavior, resizing, window dragging, and
    controls at different window sizes.
-   Verify that dialogs and the separate logs window continue to open
    and behave correctly.
-   Keep the title bar visually integrated with the selected theme.
-   Do not implement custom window controls by enabling unsafe renderer
    access to Node.js.

If the current preload does not expose the window-control operations
required by the design, document the smallest necessary,
security-conscious Electron change before implementation. Do not assume
an existing method exists without inspecting the source.

### 6.3 Sidebar

The sidebar should contain the Forge identity and direct navigation to
the existing views:

-   Download
-   Mass Clip
-   Selective Duration
-   History
-   Settings

Use Lucide icons consistently and pair icons with readable labels in the
normal expanded layout. The active destination must be visually clear
without relying on color alone.

Do not add navigation items for features that do not exist. If a
collapsed sidebar is introduced later, retain accessible names and
tooltips for icon-only navigation.

### 6.4 Workspace

Each view should have:

-   A concise title.
-   Supporting text only when it helps explain the task.
-   A clearly prioritized main workflow.
-   Consistent alignment and spacing.
-   Appropriate empty, loading, error, progress, and completion states.

Avoid wrapping every individual control in a separate card. Use a small
number of purposeful surface regions.

------------------------------------------------------------------------

## 7. Shared Component Standards

Implement or adapt source-owned React components after auditing the
existing implementation. Components should be simple, consistent,
accessible, and appropriate for JavaScript/JSX.

### 7.1 Button

Required variants:

-   Primary: one dominant action per major workflow area.
-   Secondary: useful but non-dominant actions.
-   Outline: actions needing clear boundaries without primary emphasis.
-   Ghost: low-emphasis actions such as adding a row or navigating
    secondary controls.
-   Destructive: deleting history or other destructive operations.
-   Icon button: compact actions with accessible labels or tooltips.

Requirements:

-   Consistent height, padding, radius, typography, and icon spacing.
-   Visible hover, pressed, focus-visible, disabled, and loading states.
-   Do not rely solely on opacity to indicate disabled state.
-   Do not use ambiguous unlabeled icon buttons for important actions.
-   Do not make every button mint/teal.

### 7.2 Input

-   Use consistent borders, background, radius, and focus rings.
-   Keep labels visible; placeholders are supplementary, not substitutes
    for labels.
-   Provide validation and helper text near the relevant field.
-   Support loading or inspection status without causing the input to
    jump in size.
-   Preserve keyboard behavior and text editing.
-   Use a clear disabled/read-only appearance where appropriate.

### 7.3 Select and segmented controls

Use a consistent select component for resolution and other discrete
options. Use segmented controls for small, mutually exclusive choices
such as MP4/MP3 when the available space and semantics support it.

Do not use large decorative radio cards where a compact control is
clearer. Preserve all existing selectable values and their meanings.

### 7.4 Dialog

All dialogs should share:

-   Consistent surface, border, radius, and elevation.
-   A clear title and optional concise description.
-   Predictable action placement.
-   Keyboard focus management and visible focus.
-   Escape/backdrop behavior appropriate to the operation.
-   Correct focus return to the invoking control.
-   Layout that stays within the available window bounds.

Destructive confirmation dialogs must state the consequence clearly. Do
not silently change a dialog's confirmation or cancellation semantics.

### 7.5 Badge and status pill

Use consistent styles for queued, downloading, completed, canceled,
error, active, stale, missing, and other real application states.

A badge should include understandable text. Use color and icons as
supporting cues rather than the sole signal.

### 7.6 Progress

-   Reflect actual progress events when available.
-   Clearly distinguish indeterminate activity from numeric progress.
-   Show the current operation and percentage where supplied.
-   Avoid fake progress or progress that continues after the operation
    has stopped.
-   Provide cancellation where the existing workflow supports it.
-   Keep status text readable and stable while updates arrive.

### 7.7 Card and surface

Use a shared surface pattern for genuine content groupings. Cards should
not be nested without purpose. Prefer a clear page layout with dividers
and aligned sections when that is more efficient.

### 7.8 Tooltip

Use tooltips for icon-only secondary actions, title-bar controls, and
other controls whose purpose may not be obvious. Tooltips must not be
the only accessible name for a control.

### 7.9 Toasts and inline feedback

Use toasts for brief confirmations that do not require user action. Use
inline messages for persistent errors, validation, playlist detection,
and workflow state. Avoid duplicating the same message in a toast,
modal, and inline alert.

### 7.10 Motion

Use Framer Motion only where it adds useful continuity or feedback.

-   Keep transitions short and restrained.
-   Avoid large spring effects, dramatic movement, or animations that
    delay user input.
-   Respect reduced-motion preferences where practical.
-   Never use animation completion as a reason to clear user data.
-   Ensure loading indicators remain visible and do not distract from
    content.

------------------------------------------------------------------------

## 8. Screen Specifications

The following layouts are design targets based on the current repository
audit. Preserve the existing features and data flow. Any behavior change
not explicitly confirmed must be treated as a proposal requiring
approval.

### 8.1 Download --- single media and local conversion

**Goal:** Make URL inspection, format selection, quality selection,
output location, and the primary download action clear within a compact
workspace.

Recommended hierarchy:

1.  URL input row with clear inspection feedback.
2.  Compact media metadata preview when metadata is available.
3.  Format choice and quality selection.
4.  Output folder display and change action.
5.  Primary download action and secondary local conversion action.
6.  Progress, cancellation, success, or error feedback as applicable.

Layout guidance:

-   Avoid stacking large panels that force the primary action below the
    fold at the default window size.
-   Display thumbnail, title, and duration compactly when available.
-   Use a compact MP4/MP3 segmented control.
-   Keep quality selection visible when relevant to the selected format.
-   Keep the output directory accessible without letting it dominate the
    screen.
-   Use a clearly labeled primary action, such as "Download Video" or
    "Download Audio," based on the selected format.
-   The local MP4-to-MP3 conversion remains available as a secondary
    action.

#### Playlist detection --- confirmed behavior

When a playlist URL is detected:

-   Show an inline playlist status/card in the Download workspace.
-   Explain that the URL represents a playlist.
-   Show the number of videos only when the existing inspection response
    provides that information.
-   Provide an explicit action such as **Select Videos** to open the
    existing playlist picker.
-   Do not automatically open the picker merely because the URL was
    entered or pasted.
-   Preserve the existing playlist selection and download functionality.
-   Handle inspection-in-progress, invalid URL, and inspection-error
    states without opening an unsolicited modal.

Do not assume playlist count or metadata fields exist in the current IPC
response; inspect the implementation before wiring the UI.

#### Download progress

During a download:

-   Clearly show the current operation and available progress
    percentage.
-   Keep progress tied to the existing progress events.
-   Disable or guard only controls that genuinely cannot be used during
    the operation.
-   Preserve the supported cancel action.
-   Show a clear completion or error result.

A progress bar may be visually integrated into the workbench, but must
not misrepresent progress.

### 8.2 Mass Clip Downloader

**Goal:** Make batch URLs, per-clip states, stitch behavior, and the
overall action clear and recoverable.

Recommended structure:

-   View heading and queue count.
-   A structured list or table with index, URL, status, and row actions.
-   A clear "Add another link" action.
-   An explicit stitch/no-stitch control.
-   Output directory information.
-   A footer/action area for start, cancellation, and current operation
    status.

Requirements:

-   Retain the existing per-clip states and actual progress/status
    messages.
-   Make errors and canceled states easy to identify.
-   Keep row actions discoverable.
-   Prevent accidental loss of entered URLs.
-   Ensure long URLs truncate visually without being destroyed or
    becoming impossible to edit.
-   At narrow window sizes, use a responsive row layout rather than
    forcing an unreadable table.

#### Important behavior change requiring approval

The audit reports that successful stitching triggers a five-second
timeout that resets the queue. The design target is to keep completed
rows visible until the user explicitly clears them or starts a
deliberate new workflow. However, removing or changing the timer
modifies existing behavior; inspect the code, preserve any necessary
state transitions, and implement this change only as an explicitly
approved usability improvement. Never clear user-entered data solely
because a timer expired.

### 8.3 Selective Duration Downloader

**Goal:** Make precise trimming understandable while retaining the
specialist timeline workflow.

Recommended hierarchy:

1.  URL input and inspection action.
2.  Compact media metadata strip when loaded.
3.  Timeline and time ruler.
4.  Visible start/end time controls.
5.  Multi-clip queue with per-clip actions.
6.  Output format/quality and precise-cut options.
7.  Primary "Download All Clips" action and supported
    cancellation/status feedback.

Timeline requirements:

-   Preserve current drag behavior, time calculations, clip boundaries,
    lock/exclude behavior, and download semantics.
-   Show readable time markers.
-   Add visible zoom controls if approved and if they can be connected
    to the existing timeline state safely.
-   Retain Ctrl + mouse-wheel zoom if it remains supported.
-   Provide clear start/end handles and visible time readouts.
-   Use monospace styling for timecodes.
-   Make the selected range and excluded/locked states understandable
    without relying only on color.
-   Keep controls usable at the default window size; allow the timeline
    area to receive the space it needs.

Do not change trimming precision, keyframe/re-encoding behavior, clip
order, or queue execution while restyling the timeline.

#### Inspection consistency

The audit notes that the standard Download view automatically inspects
URLs while the Selective Duration view uses a separate Fetch Details
action. A more consistent experience is desirable, but do not silently
change when or how metadata requests fire. First preserve the current
trigger and loading/error behavior; any change to automatic fetching
should be explicitly approved.

### 8.4 Download History

**Goal:** Make previous work easy to scan, locate, copy, and delete.

Recommended hierarchy:

-   View title and a clear Clear History action.
-   Search/filter controls where compatible with current data.
-   Consistent filter controls for the actual supported history
    categories.
-   Rows or compact cards with file type, filename, original URL, output
    path where available, timestamp, and actions.
-   Pagination or item count controls appropriate to the amount of
    history.

Requirements:

-   Keep Open in Folder, Copy URL, and Delete actions discoverable by
    default.
-   Do not hide essential actions exclusively behind hover.
-   Preserve `download-history` format and existing records.
-   Keep destructive actions explicit and confirmed.
-   Make empty history state useful and concise.
-   Handle long filenames and paths with truncation and an accessible
    way to inspect/copy the full value.
-   Use real timestamps and paths from saved records; do not invent
    relative dates or metadata.
-   Do not remove or reinterpret history records as part of visual
    cleanup.

Search, new filters, and adjustable page sizes are potential usability
additions, not assumed existing capabilities. Implement them only after
checking the current data model and agreeing on scope.

### 8.5 Settings and Diagnostics

**Goal:** Separate user preferences from system health and developer
tools.

Recommended sections:

**Preferences** - Current output directory with a Browse/Change
action. - Theme selection with clear Dark and Light choices. - Any other
existing preferences that are verified in the repository.

**Browser authentication** - Current browser and cookie status. - Last
sync date when available. - A Configure action opening the existing
cookie wizard. - Clear distinction between active, stale, and missing
authentication states.

**System diagnostics** - Python/backend, FFmpeg, FFprobe, and dependency
health using actual diagnostic results. - A refresh action with visible
loading and error feedback. - Optional collapsible detail for
dependency/DLL information to reduce visual noise.

**Developer tools** - A clear action to open the existing developer logs
window.

Do not imply that a dependency is healthy when the diagnostic result is
missing or unknown. Keep diagnostics concise by default, but allow
details to be inspected.

### 8.6 Cookie Setup Wizard

**Goal:** Make browser-cookie setup guided, understandable, and
consistent with the shared dialog design.

Requirements:

-   Use a standard dialog surface with a clear title, description, step
    indicator, and predictable footer.
-   Keep the dialog within the available window bounds.
-   Make the current step and expected action obvious.
-   Keep Cancel, Back, Next, and Finish placement consistent.
-   Clearly identify supported browser choices based on actual
    implementation.
-   Provide explicit instructions for Firefox extraction and Chromium
    extension/file import where those workflows exist.
-   For drag-and-drop file import, show a clear drop target, accepted
    file expectations, hover/drag state, and Browse Files action.
-   Show validation and extraction/import errors inline.
-   Preserve existing cookie extraction, import, status, and persistence
    behavior.
-   Do not expose cookie contents or sensitive browser data in the UI,
    logs, or error messages.

The audit describes a five-step wizard but also references a "Step 2 of
4" example. Verify the actual number and order of steps in source; the
displayed step count must match the implementation, not the example.

### 8.7 Playlist Selection Dialog

**Goal:** Let users deliberately review and select videos from a
detected playlist.

Requirements:

-   Open only after the user activates the explicit selection action.
-   Present playlist context and available video metadata from the
    actual inspection result.
-   Make selection state obvious and accessible.
-   Provide clear Select/Download and Cancel actions consistent with
    existing semantics.
-   Handle loading, empty, and error states.
-   Keep the dialog within the window bounds.
-   Preserve the current selection payload and download behavior.

### 8.8 Output Folder Dialog

**Goal:** Make the chosen output directory easy to verify before
proceeding.

Requirements:

-   Display the selected path clearly.
-   Provide an obvious Browse/Change action.
-   Keep Confirm and Cancel semantics consistent with the existing
    workflow.
-   Handle long paths without breaking layout.
-   Preserve directory selection and unique-folder behavior.

### 8.9 Clear History Dialog

**Goal:** Prevent accidental irreversible history clearing.

Requirements:

-   State clearly that the action clears the download history.
-   Provide visually distinct Cancel and destructive confirmation
    actions.
-   Do not style the destructive action as the normal primary mint
    action.
-   Keep keyboard focus and Escape behavior safe and predictable.
-   Preserve existing deletion semantics; do not delete downloaded files
    unless the existing action explicitly does so.

### 8.10 Developer Logs Window

**Goal:** Make technical output readable and visually consistent with
Forge.

Requirements:

-   Use the active theme's surface and text tokens.
-   Keep logs in a legible monospace font with appropriate line spacing.
-   Maintain strong contrast and distinguish errors/warnings when
    reliable source information supports it.
-   Preserve the existing log stream and window behavior.
-   Avoid syntax decoration that obscures raw output.
-   Handle long lines with a usable horizontal-scroll or wrapping
    strategy appropriate for logs.

------------------------------------------------------------------------

## 9. Theme Behavior

### 9.1 Initial theme

On a fresh installation, use dark mode.

### 9.2 Theme persistence

-   Preserve the existing `theme` localStorage key.
-   Persist the user's explicit theme choice using the existing format
    unless a migration is separately approved.
-   Apply the selected theme consistently across the main window,
    dialogs, dropdowns, tooltips, and logs window where practical.
-   Avoid a flash of the wrong theme during startup.
-   Do not reset a user's saved theme during the redesign.

### 9.3 Light mode quality

Light mode is a first-class theme, not an afterthought. Verify text
contrast, borders, disabled states, input surfaces, status badges,
popovers, and dialogs independently in light mode. Do not simply invert
the dark palette.

------------------------------------------------------------------------

## 10. Accessibility and Interaction Requirements

-   All interactive controls must be keyboard reachable.
-   Use visible focus indicators.
-   Maintain logical focus order.
-   Return focus appropriately after closing dialogs.
-   Provide accessible names for icon buttons and custom window
    controls.
-   Use labels for inputs and descriptive text for validation.
-   Do not communicate state by color alone.
-   Respect reduced-motion preferences where practical.
-   Ensure disabled and loading states are understandable.
-   Keep hit targets comfortably usable in a desktop environment.
-   Avoid hover-only essential actions.
-   Ensure custom controls preserve appropriate keyboard interaction.
-   Verify that title-bar drag regions do not intercept buttons or
    inputs.

Accessibility should be built into shared primitives rather than patched
separately on every screen.

------------------------------------------------------------------------

## 11. Responsive Desktop Behavior

Forge is a desktop application, but the user can resize its window.

At the existing 900 × 700 default size:

-   Keep the primary action visible on the Download view whenever
    practical.
-   Keep navigation labels and active state clear.
-   Avoid horizontal overflow in ordinary workflows.
-   Let the selective timeline remain usable without crushing its time
    controls.
-   Reflow mass-clip rows when a table would become too narrow.
-   Keep dialogs within window bounds.
-   Preserve access to footer actions when content scrolls.

At smaller sizes, prioritize essential content and actions rather than
shrinking every control indefinitely. At larger sizes, use additional
space to improve alignment and readability, not to inflate cards
unnecessarily.

------------------------------------------------------------------------

## 12. Motion and State Transitions

Motion should reinforce cause and effect.

Appropriate uses include:

-   Subtle view transitions.
-   Small hover/press feedback.
-   Dropdown and dialog transitions.
-   Progress feedback tied to real operations.
-   Expanding/collapsing secondary diagnostics.

Avoid:

-   Long blocking animations.
-   Large entrance animations on every card.
-   Decorative continuous movement.
-   Motion that causes layout jumps.
-   Resetting queues or clearing inputs after an animation or timeout.
-   Animations that make status text or controls difficult to track.

Critical operations must remain responsive while transitions occur.

------------------------------------------------------------------------

## 13. Behavior Change Policy

Separate visual changes from workflow changes.

### Safe visual changes, provided behavior is preserved

-   Replacing glassmorphic surfaces with solid theme-aware surfaces.
-   Standardizing spacing, typography, radii, and button styles.
-   Improving layout and information hierarchy.
-   Making existing actions visible by default.
-   Improving focus indicators, contrast, labels, and responsive layout.
-   Restyling existing progress and status feedback without changing its
    source.

### Changes requiring explicit approval and regression testing

-   Changing when URL inspection is triggered.
-   Changing playlist modal behavior.
-   Removing the mass-clip auto-reset timer.
-   Adding history search, new filters, or adjustable pagination.
-   Adding new timeline zoom controls or changing zoom behavior.
-   Changing cancellation, confirmation, or close-window behavior.
-   Changing theme options or persistence format.
-   Changing queue state transitions, default stitch behavior, or output
    selection.
-   Changing metadata-fetch timing or retry behavior.

The playlist detection change and dark default are already approved
decisions. The custom frameless title bar is also approved, but its
exact Electron implementation must be verified against the current
architecture.

No behavior change may silently alter IPC contracts, backend processing,
persisted data formats, or user-entered work.

------------------------------------------------------------------------

## 14. Implementation Guidance

Implement the redesign incrementally.

### Phase 1 --- Audit and foundations

-   Reconfirm the actual repository structure and current source.
-   Inspect the existing Electron preload and determine the safe
    mechanism for frameless window controls.
-   Confirm the current theme implementation and CSS variable strategy.
-   Check shadcn/ui compatibility with the actual JavaScript/JSX and
    Tailwind CSS 3.4 setup.
-   Establish semantic tokens and a consistent component API.
-   Avoid broad automated rewrites.

### Phase 2 --- Shared shell and primitives

-   Build the custom title bar and application shell.
-   Implement or adapt button, input, select, dialog, tabs/segmented
    control, badge, progress, tooltip, and surface patterns as needed.
-   Verify keyboard access, theme behavior, and window dragging before
    migrating all screens.

### Phase 3 --- Screen migration

Migrate one screen at a time, preserving the existing logic and
integration boundaries. Prefer moving UI into focused components over
rewriting business logic.

Recommended order:

1.  Single Download.
2.  Mass Clip Downloader.
3.  Selective Duration Downloader.
4.  History.
5.  Settings and diagnostics.
6.  Dialogs and developer logs window.

This order may be adjusted if the code audit reveals dependencies that
make another order safer.

### Phase 4 --- Polish and verification

-   Check both themes at the default window size.
-   Verify every existing workflow.
-   Check errors, cancellation, empty states, and progress updates.
-   Run linting and the production build.
-   Verify backend packaging and Electron installer packaging.
-   Review the final diff for accidental changes to IPC, backend
    behavior, and stored data.

Do not claim tests passed unless they were actually run and their
results observed.

------------------------------------------------------------------------

## 15. Acceptance Checklist

### Visual consistency

-   [ ] Precision Studio visual direction is consistent across all
    existing screens.
-   [ ] Dark mode is the fresh-install default.
-   [ ] Light mode is fully styled and readable.
-   [ ] Mint/teal is restrained and used consistently.
-   [ ] Cards, inputs, buttons, dialogs, and badges use consistent
    tokens.
-   [ ] Excessive glassmorphism and competing surface styles have been
    removed.
-   [ ] Main actions are easy to identify.

### Frameless window

-   [ ] Window can be dragged from the intended title-bar region.
-   [ ] Minimize, maximize/restore, and close work correctly.
-   [ ] Window controls have hover, pressed, and keyboard-focus states.
-   [ ] Drag regions do not block buttons or inputs.
-   [ ] Resizing works at expected dimensions.
-   [ ] Main dialogs and the logs window continue to function.
-   [ ] No unsafe renderer access has been introduced.

### Existing workflows

-   [ ] Single MP4 download works.
-   [ ] Single MP3 download works.
-   [ ] Local MP4-to-MP3 conversion works.
-   [ ] URL inspection and format retrieval work.
-   [ ] Playlist detection appears inline and the explicit selection
    action opens the picker.
-   [ ] Playlist selection and download work.
-   [ ] Mass clip queue, cancellation, and stitching work.
-   [ ] Selective timeline controls, clip ranges, and downloads work.
-   [ ] History filters/pagination, copy URL, open location, and
    deletion work.
-   [ ] Output directory selection and persistence work.
-   [ ] Cookie extraction and file import work.
-   [ ] System diagnostics and refresh work.
-   [ ] Developer logs open and show real output.
-   [ ] Errors and authentication barriers remain visible and
    understandable.

### Data and technical integrity

-   [ ] IPC method names, channels, payloads, and event semantics remain
    intact.
-   [ ] Existing localStorage keys and data formats remain compatible.
-   [ ] No user input or queue is cleared unexpectedly.
-   [ ] Progress represents actual operation state.
-   [ ] No credentials or cookie contents are exposed.
-   [ ] Linting is run and results recorded.
-   [ ] Production build is run and results recorded.
-   [ ] Backend packaging is verified.
-   [ ] Electron installer packaging is verified.

------------------------------------------------------------------------

## 16. Open Implementation Questions

These are implementation details to resolve from the code rather than
reasons to block the design:

-   Which existing Electron APIs, if any, already support custom window
    controls?
-   How are theme classes and CSS variables currently applied?
-   What exact playlist metadata is available from URL inspection?
-   What are the actual cookie-wizard steps and browser-specific flows?
-   What queue reset behavior currently occurs after mass stitching, and
    what state transitions depend on it?
-   Which current view components can be extracted without changing
    their behavior?
-   Which shadcn/ui primitives can be adopted cleanly without upgrading
    Tailwind or introducing unnecessary dependencies?

Document any newly discovered risk before making changes that affect
behavior.

------------------------------------------------------------------------

## 17. Final Rule

**Forge should look new while remaining recognizably and reliably
Forge.**

Prioritize clarity, control, consistency, and technical reliability.
Keep the interface compact enough for a desktop utility, make important
actions discoverable, respect user work, and preserve the existing
application contracts.

When a design choice conflicts with reliable existing behavior, preserve
behavior and propose the change separately for approval.
