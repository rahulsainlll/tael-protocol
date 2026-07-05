import { type Payment } from "@tael/types";

/** Port for payment persistence (see wallet.repository for the rationale). */
export interface PaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  list(): Promise<Payment[]>;
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly payments = new Map<string, Payment>();

  save(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment);
    return Promise.resolve(payment);
  }

  findById(id: string): Promise<Payment | null> {
    return Promise.resolve(this.payments.get(id) ?? null);
  }

  list(): Promise<Payment[]> {
    return Promise.resolve([...this.payments.values()]);
  }
}
