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
