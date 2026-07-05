# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets). It is how we
version and publish the public `@tael/*` packages.

## Workflow

When you make a change to a **published** package (`packages/*`), add a changeset describing it:

```bash
pnpm changeset
```

Pick the affected packages and a semver bump (`patch` / `minor` / `major`), then write a one-line
summary aimed at consumers. Commit the generated file in this folder alongside your code.

Apps (`@tael/api`, `web`) are deployables, not published to npm, so they are listed under `ignore`
in `config.json` and do not need changesets.

Releases are automated: merging a changeset to `main` opens a "Version Packages" PR; merging that PR
builds and publishes the affected packages (see `.github/workflows/release.yml`).
