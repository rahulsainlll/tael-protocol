import { Money, TaelError, type Wallet } from "@tael/types";
import { type CreateWalletInput } from "./wallet.schema";
import { type WalletRepository } from "./wallet.repository";

/**
 * Wallet business logic. Pure orchestration over the repository port — no HTTP,
 * no framework, no direct persistence. Trivially unit-testable (see the test).
 */
export class WalletService {
  constructor(private readonly repository: WalletRepository) {}

  async create(input: CreateWalletInput): Promise<Wallet> {
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      address: input.address,
      balance: Money.zero().toDecimalString(),
      createdAt: new Date().toISOString(),
    };
    return this.repository.save(wallet);
  }

  async get(id: string): Promise<Wallet> {
    const wallet = await this.repository.findById(id);
    if (!wallet) {
      throw new TaelError("NOT_FOUND", `Wallet ${id} not found`);
    }
    return wallet;
  }

  list(): Promise<Wallet[]> {
    return this.repository.list();
  }
}
