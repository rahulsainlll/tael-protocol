# @tael/stellar

Stellar **settlement primitives** — the blockchain layer.

- `usdcAsset(issuer)` — construct the USDC asset.
- `networkPassphrase(network)` — testnet/mainnet passphrases.
- `StellarSettlement` — submit a client-signed transaction envelope (XDR) to Horizon.

## Boundaries

Depends only on `@tael/types` and the Stellar SDK. It has **no knowledge of x402, HTTP, or the
database** — that composition happens in `apps/api`, which adapts `StellarSettlement` into a
`@tael/payments` `PaymentVerifier`.

- **Belongs here:** anything Stellar/Soroban-specific (assets, transactions, RPC, contract calls).
- **Never here:** payment-protocol logic, request handling, business rules.

> Future: on-chain settlement via Soroban contracts (see `contracts/`) will live behind
> `StellarSettlement`, so callers don't change.
