// Root ESLint config. Runs across every workspace via `pnpm lint` (`eslint .`).
// The actual ruleset is centralized in @tael/config so all workspaces share it.
import config from "@tael/config/eslint";

export default config;
