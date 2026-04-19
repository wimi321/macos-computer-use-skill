# Contributing

Thanks for your interest in contributing to macOS Computer-Use Skill.

## Prerequisites

- macOS 12+ (Monterey or later)
- Node.js 20+
- Python 3.10+
- Accessibility and Screen Recording permissions granted

## Development Setup

```bash
git clone https://github.com/wimi321/macos-computer-use-skill.git
cd macos-computer-use-skill
npm install
npm run build
```

Run the MCP server locally:

```bash
node dist/cli.js
```

Type-check without emitting:

```bash
npm run check
```

## Pull Request Process

1. Fork the repository and create a feature branch from `main`.
2. Make your changes. Run `npm run check` to ensure type safety.
3. Test on a real macOS machine — this project cannot be validated in CI alone.
4. Submit a PR with a clear description of what changed and why.

## Code Style

- TypeScript with ESM (`"type": "module"`)
- No lint or format config yet — match the style of surrounding code.
- Keep changes focused. One PR per concern.

## Reporting Issues

Open an issue on [GitHub Issues](https://github.com/wimi321/macos-computer-use-skill/issues) with:

- macOS version
- Node.js and Python versions
- Steps to reproduce
- Error output or screenshots
