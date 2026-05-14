# Contributing to Gitify

Thank you for your interest in contributing to Gitify! This guide will help you get started.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/gitify.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Start the dev server: `npm run dev`
6. Make your changes
7. Commit: `git commit -m "Add your feature"`
8. Push: `git push origin feature/your-feature`
9. Open a Pull Request

## 📁 Project Structure

- **`src/engine/`** — Core simulation engines (filesystem, Git, parser)
- **`src/components/`** — React UI components
- **`src/lessons/`** — Level definitions and progress management
- **`src/app/`** — Next.js pages and styles

## 💡 Contribution Ideas

### Adding a New Level
1. Open `src/lessons/levels.js`
2. Add a new level object following the existing pattern
3. Define `initialFS` (starting filesystem), `objectives`, and `preInit` (optional setup)
4. Each objective needs an `id`, `text`, `hint`, and `validate` function

### Adding a New Command
1. Add the implementation in `src/engine/virtualFS.js` (filesystem) or `src/engine/gitEngine.js` (git)
2. Add the routing in `src/engine/commandParser.js`
3. Update the `help` command output

### Improving the UI
- All styles use CSS Modules (`*.module.css`)
- Design tokens are in `src/app/globals.css`
- Follow the existing dark terminal aesthetic

## 📋 Guidelines

- Keep code simple and readable
- Test your changes locally before submitting
- Follow existing code style and patterns
- Write descriptive commit messages
- Update documentation if needed

## 🐛 Reporting Bugs

Open an issue on GitHub with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser and OS information

## 📝 Code of Conduct

Be respectful and inclusive. We're all here to learn and build something great together.
