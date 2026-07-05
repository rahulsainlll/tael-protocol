import { describe, expect, it } from "vitest";
import { TaelError } from "@tael/types";
import { InMemoryWalletRepository } from "./wallet.repository";
import { WalletService } from "./wallet.service";

const ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

function service() {
  return new WalletService(new InMemoryWalletRepository());
}

describe("WalletService", () => {
  it("creates a wallet with a zero balance", async () => {
    const wallet = await service().create({ ownerId: "user_1", address: ADDRESS });
    expect(wallet.id).toBeTruthy();
    expect(wallet.address).toBe(ADDRESS);
    expect(wallet.balance).toBe("0");
  });

  it("retrieves a created wallet", async () => {
    const svc = service();
    const created = await svc.create({ ownerId: "user_1", address: ADDRESS });
    expect(await svc.get(created.id)).toEqual(created);
  });

  it("throws NOT_FOUND for an unknown wallet", async () => {
    await expect(service().get("missing")).rejects.toBeInstanceOf(TaelError);
  });
});
