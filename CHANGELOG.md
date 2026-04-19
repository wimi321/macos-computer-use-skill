# Changelog

All notable changes to this project will be documented in this file.

## [0.2.2] - 2026-04-01

### Fixed

- **IME typing corruption on macOS**: Under a non-US input source (e.g. Chinese IME), single-key typing could produce corrupted text. Multi-character text now routes through the clipboard by default, avoiding IME interference entirely.

### Changed

- Refreshed documentation and hero artwork.

## [0.2.1] - 2026-04-01

### Changed

- Updated package metadata and version stamps.

## [0.2.0] - 2026-03-31

### Changed

- Renamed repository and package to `macos-computer-use-skill` for skill-first branding.
- Bundled self-contained project into the published skill at `skill/computer-use-macos/`.
- Documented ClawHub distribution entrypoints.

## [0.1.0] - 2026-03-31

### Added

- Initial extraction of standalone macOS computer-use MCP server.
- TypeScript tool layer with 28 MCP tools: screenshot, mouse, keyboard, clipboard, app control, display management, batch actions, and teach mode.
- Python runtime bridge (`mac_helper.py`) using pyautogui, mss, Pillow, and pyobjc.
- Zero-config runtime bootstrap: auto-creates Python virtualenv on first run.
- Tiered application permission model with denied-app lists.
- Coordinate scaling for both pixel and normalized modes.
- Portable skill packaging for ClawHub and local install.
