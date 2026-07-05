import { type Wallet } from "@tael/types";

/**
 * Port for wallet persistence. The service depends on this interface, never on a
 * concrete store — so the Drizzle/Postgres adapter (packages/database, later)
 * drops in without touching business logic and without a placeholder package now.
 */
export interface WalletRepository {
  save(wallet: Wallet): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
  list(): Promise<Wallet[]>;
}

/** In-memory adapter — the default for local dev and tests. */
export class InMemoryWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, Wallet>();

  save(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.id, wallet);
    return Promise.resolve(wallet);
  }

  findById(id: string): Promise<Wallet | null> {
    return Promise.resolve(this.wallets.get(id) ?? null);
  }

  list(): Promise<Wallet[]> {
    return Promise.resolve([...this.wallets.values()]);
  }
}
