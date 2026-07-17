import { TaelError, type Payment } from "@tael/types";
import { type RecordPaymentInput } from "./payment.schema";
import { type PaymentRepository } from "./payment.repository";

/** Payment ledger business logic over the repository port. */
export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async record(input: RecordPaymentInput): Promise<Payment> {
    const payment: Payment = {
      id: crypto.randomUUID(),
      capabilityId: input.capabilityId,
      capabilityName: null,
      payer: input.payer,
      payee: input.payee,
      amount: input.amount,
      fee: "0",
      status: "pending",
      txHash: null,
      createdAt: new Date().toISOString(),
    };
    return this.repository.save(payment);
  }

  /**
   * Record a payment that has already settled on-chain — used by the gateway
   * after a capability call is verified. Unlike {@link record}, the tx is known.
   * `amount` is the builder's net share; `fee` is Tael's cut from the same tx.
   */
  async recordSettled(input: {
    capabilityId: string;
    capabilityName?: string | null;
    payer: string;
    payee: string;
    amount: string;
    fee: string;
    txHash: string;
  }): Promise<Payment> {
    const payment: Payment = {
      id: crypto.randomUUID(),
      capabilityId: input.capabilityId,
      capabilityName: input.capabilityName ?? null,
      payer: input.payer,
      payee: input.payee,
      amount: input.amount,
      fee: input.fee,
      status: "settled",
      txHash: input.txHash,
      createdAt: new Date().toISOString(),
    };
    return this.repository.save(payment);
  }

  async get(id: string): Promise<Payment> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new TaelError("NOT_FOUND", `Payment ${id} not found`);
    }
    return payment;
  }

  list(): Promise<Payment[]> {
    return this.repository.list();
  }
}
