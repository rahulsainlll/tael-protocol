import {
  desc,
  eq,
  payments as paymentsTable,
  type Database,
  type Payment as PaymentRow,
} from "@tael/database";
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

/** Map a persisted row to the domain {@link Payment} shape. */
function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    capabilityId: row.capabilityId ?? "",
    payer: row.payer,
    payee: row.payee,
    amount: row.amount,
    fee: row.fee,
    status: row.status as Payment["status"],
    txHash: row.txHash,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Postgres-backed adapter over @tael/database — the settlement ledger. */
export class DbPaymentRepository implements PaymentRepository {
  constructor(private readonly db: Database) {}

  async save(payment: Payment): Promise<Payment> {
    const [row] = await this.db
      .insert(paymentsTable)
      .values({
        id: payment.id,
        capabilityId: payment.capabilityId || null,
        payer: payment.payer,
        payee: payment.payee,
        amount: payment.amount,
        fee: payment.fee,
        status: payment.status,
        txHash: payment.txHash,
      })
      // A duplicate txHash (a replayed settlement) inserts nothing — the payment
      // is already on the ledger, so treat the write as idempotent instead of
      // letting the unique constraint surface as a 500.
      .onConflictDoNothing({ target: paymentsTable.txHash })
      .returning();
    return row ? toPayment(row) : payment;
  }

  async findById(id: string): Promise<Payment | null> {
    const [row] = await this.db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, id))
      .limit(1);
    return row ? toPayment(row) : null;
  }

  async list(): Promise<Payment[]> {
    const rows = await this.db.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
    return rows.map(toPayment);
  }
}
