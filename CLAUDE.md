# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm test               # Run tests (mocha dist/timecode.test.js)
npm run test-coverage  # Run tests with nyc coverage reporting
```

Tests run against compiled output in `dist/`, so always run `npm run build` before `npm test` when source changes.

There is no separate lint script — ESLint is configured but not wired into a script.

## Architecture

This is a single-class TypeScript library (`src/timecode.ts`) with no runtime dependencies. The `Timecode` class is the entire public API. Tests live in `src/timecode.test.ts`, colocated with the source, and are compiled alongside it.

**Build output** goes to `dist/` (tracked in source control). The package entry points directly into `dist/src/timecode.js` and `dist/src/timecode.d.ts`.

### Key design patterns

- **Immutability**: arithmetic methods (`add`, `subtract`, `pulldown`, `pullup`, `slowdown`, `speedup`) return new `Timecode` instances rather than mutating.
- **Setter chaining**: field setters (`setHours`, `setMinutes`, etc.) return `this` and handle overflow/underflow automatically (e.g., setting 72 minutes wraps to 1 hour 12 minutes).
- **Drop-frame timecode**: 29.97 and 59.94 fps use drop-frame (skipping frame numbers 0 and 1 at every minute except every 10th). The separator in `toString()` changes from `:` to `;` for drop-frame rates.
- **Cross-rate arithmetic**: `add`/`subtract` handle operands at different frame rates by converting to a common rate before computing.

### Constructor inputs (`ConvertibleToTimecode`)

The constructor accepts: another `Timecode`, a timecode string (`HH:MM:SS:FF` or `HH:MM:SS.mmm`), a plain object with `TimecodeAttributes` fields, a frame count as a number, or a `Date` object.

### Frame rate conversions

- `pulldown(rate)` / `pullup()` — preserves real-time position while changing frame rate (e.g., 24→29.97)
- `slowdown(rate)` / `speedup()` — changes playback speed without preserving real time

## Style

Follows the Airbnb JavaScript Style Guide, enforced with ESLint (flat config, `eslint.config.mjs`). Max line length is 140 characters. TypeScript strict mode is enabled.

## Testing notes

Test values are verified against Avid Media Composer's timecode calculator. Tests aim for 100% coverage.
