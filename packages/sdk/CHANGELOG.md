# Changelog

All notable changes to `@tael/sdk` are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## 0.2.2

- Documentation: a complete, field-by-field publish reference (manifest table,
  kind selection, auth schemes, operations and pricing) so a developer or AI can
  produce a correct manifest from the README alone.
- Added npm and GitHub badges; replaced a real payout address in the publish
  example with a placeholder.

## 0.2.0

- Publish side: manage the capabilities you sell from code with the same API key.
  - `publish(input)` — list a capability (any kind: api, mcp, agent, model,
    dataset, credit). It goes live immediately as `pending`.
  - `updateCapability(id, input)` — change only the fields you pass; a blank
    secret keeps the current one.
  - `myCapabilities()` — list the capabilities you publish.
  - `unpublish(id)` — remove a capability.

## 0.1.1

- Buy side: the `Tael` client — call any capability with one API key.
  - `get` / `post` / `call` — call a capability; `call` returns the data, HTTP
    status, and the on-chain settlement receipt.
  - `list` / `search` — discover capabilities from the marketplace catalog.
  - `TaelError` — thrown on a failed call, carrying the gateway status + message.
- Sell side: the `tael()` / `createTael()` wrapper — gate any Fetch handler
  behind an x402 payment in one call.
- Published to npm as a self-contained package with a single runtime dependency.
