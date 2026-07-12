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
      payer: input.payer,
      payee: input.payee,
      amount: input.amount,
      status: "pending",
      txHash: null,
      createdAt: new Date().toISOString(),
    };
    return this.repository.save(payment);
  }

  /**
   * Record a payment that has already settled on-chain — used by the gateway
   * after a capability call is verified. Unlike {@link record}, the tx is known.
   */
  async recordSettled(input: {
    capabilityId: string;
    payer: string;
    payee: string;
    amount: string;
    txHash: string;
  }): Promise<Payment> {
    const payment: Payment = {
      id: crypto.randomUUID(),
      capabilityId: input.capabilityId,
      payer: input.payer,
      payee: input.payee,
      amount: input.amount,
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
