# Contributing to Gins Blog

English | [简体中文](./CONTRIBUTING.zh.md)

Thanks for your interest in contributing! This document provides guidelines for contributing to the project.

## Branching Strategy

We use a strict branching workflow to ensure stability:

- **`main`**: Stable deployment branch. **DO NOT push directly to main.**
- **`dev`**: The active development branch. All new features and fixes should be merged here first.

## Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gins-blog.git
   cd gins-blog
   ```

2. **Checkout the Dev Branch**
   Always start your work from `dev`, not `main`.
   ```bash
   git checkout dev
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**
   We use `npm` for dependency management.
   ```bash
   npm install
   ```

4. **Environment Setup**
   Copy `.dev.vars.example` (if available) or create `.dev.vars` with necessary keys:
   ```
   # Required for local development
   DB=...
   GIN_KV=...
   GINS_CACHE=...
   BUCKET=...
   ...
   ```

5. **Run Local Server**
   ```bash
   npm run dev
   ```

## Development Workflow

1. **Make Changes**: Implement your feature or fix.
2. **Database Changes**: If you modify the schema (`db/schema.ts`), generate migrations:
   ```bash
   npm run db:generate
   ```
   *Note: For local testing with D1, use `npm run db:migrate:local` or `wrangler d1 execute`.*

3. **Testing**: Ensure your changes work locally and don't break existing functionality.

## Submitting Changes

1. **Commit**: Use descriptive commit messages.
   ```bash
   git commit -m "feat: add amazing new feature"
   ```

2. **Push**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Pull Request**:
   - Open a Pull Request targeting the **`dev`** branch.
   - **DO NOT** target `main` directly.
   - Describe your changes and link to any relevant issues.

## Tech Stack & Code Style

- **Framework**: Astro + Preact
- **Styling**: UnoCSS (Atomic CSS engine) & Vanilla CSS for custom effects
- **Runtime**: Cloudflare Workers
- **Database**: Drizzle ORM with Cloudflare D1
- **Language**: TypeScript (Strict mode)

Ensure strict type checking is satisfied and follow the existing project structure.

## Deployment

- Commits merged to `main` are automatically deployed to production.
- `dev` serves as the staging area for testing integration before release.

Happy Coding!
