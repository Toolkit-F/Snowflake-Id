# Contributing to Snowflake-ID

❤️ Thanks for wanting to contribute!

## Getting Started

### Prerequisites
- **Node.js** 18, 20, or 22 (LTS versions)
- **npm**

### Setup
1. **Fork** the repo on GitHub.
2. **Clone** your fork:
    ```bash
    git clone https://github.com/Toolkit-F/Snowflake-Id.git
    cd Snowflake-Id
    ```
3. **Install dependencies**:
    ```bash
    npm ci
    ```

## Development Workflow

We use a **Feature Branch** workflow. The `main` branch is protected.

1. **Create a branch** with a descriptive name:
    ```bash
    git checkout -b feat/add-new-feature
    git checkout -b fix/collision-bug
    git checkout -b docs/improve-readme
    ```

2. **Make your changes** — write clean TypeScript.

3. **Run tests** before committing (we use Vitest):
    ```bash
    npm test
    npx vitest  # watch mode
    ```
    Don't break existing tests. Add tests for new features.

4. **Build** to check for errors:
    ```bash
    npm run build
    ```

## Commit Guidelines

Use **Conventional Commits**:

Format: `<type>(<scope>): <subject>`

Examples:
- `feat: add support for custom epoch`
- `fix: resolve overflow issue in sequence generation`
- `docs: update installation instructions`
- `test: add unit tests for date parsing`
- `chore: update dependencies`

## Pull Requests

1. **Push** your branch:
    ```bash
    git push origin feat/add-new-feature
    ```
2. **Open a PR** against `main`.
3. **Describe** what you changed and why. Link issues if applicable (e.g., `Fixes #123`).
4. **Wait for CI** — tests run on Node.js 18, 20, and 22. PRs must pass to merge.
5. **Review** — maintainers may request changes.

We use **Squash and Merge**, so don't worry about cleaning up commits.

## Reporting Bugs

Open an issue with:
- Description of the bug
- Steps to reproduce (code snippets help)
- Expected vs actual behavior

## Feature Requests

Got an idea? Open an issue first so we can discuss it before you start coding.

---
Happy Coding! ❄️