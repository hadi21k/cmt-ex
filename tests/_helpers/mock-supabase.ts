// In-memory stand-in for the @supabase/ssr server client.
// Supports only the chain operations the workflow engine uses:
//   from(t).insert(rows).select().single() | .select() (array)
//   from(t).select(cols?).eq(col, val).single() | .maybeSingle() | (await → array)
//   from(t).select(cols?).eq(col, val).order(col, {ascending}) (await → array)
//   from(t).update(patch).eq(col, val)
//
// Each test calls resetMockDb() in beforeEach and installs the mock
// once at the top of the file. UNIQUE(source_event_id) is enforced
// at the JS layer here because the engine's idempotency short-circuit
// runs a SELECT first, but we still want the test fixture to behave
// like the real DB on a direct double-insert.

type Row = Record<string, unknown> & { id: string };

interface Db {
  events: Row[];
  actions: Row[];
  review_queue_items: Row[];
  audit_logs: Row[];
}

const initialDb = (): Db => ({
  events: [],
  actions: [],
  review_queue_items: [],
  audit_logs: [],
});

export const db: Db = initialDb();

let idCounter = 0;
let timeCounter = 0;

const nextId = () => `id-${++idCounter}`;

// Distinct timestamps so order(created_at desc) is deterministic.
const nextTime = () => {
  timeCounter += 1;
  return new Date(1700000000000 + timeCounter).toISOString();
};

export function resetMockDb(): void {
  db.events.length = 0;
  db.actions.length = 0;
  db.review_queue_items.length = 0;
  db.audit_logs.length = 0;
  idCounter = 0;
  timeCounter = 0;
}

class Query {
  private op: "select" | "insert" | "update" | null = null;
  private rowsToInsert: Row[] = [];
  private patch: Record<string, unknown> | null = null;
  private filters: Array<[string, unknown]> = [];
  private orderBy: { col: string; asc: boolean } | null = null;

  constructor(private table: keyof Db) {}

  select(_cols?: string): this {
    if (this.op === null) this.op = "select";
    return this;
  }

  insert(rowOrRows: Record<string, unknown> | Record<string, unknown>[]): this {
    this.op = "insert";
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    this.rowsToInsert = rows.map((r) => ({
      ...r,
      id: nextId(),
      created_at: nextTime(),
      ...(this.table === "events" ? { updated_at: nextTime() } : {}),
    }) as Row);
    return this;
  }

  update(patch: Record<string, unknown>): this {
    this.op = "update";
    this.patch = patch;
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push([col, val]);
    return this;
  }

  order(col: string, opts: { ascending: boolean }): this {
    this.orderBy = { col, asc: opts.ascending };
    return this;
  }

  // Terminator: expect exactly one row, error if zero.
  async single() {
    const rows = await this.exec();
    if (rows.length === 0) {
      return { data: null, error: new Error("No rows returned") };
    }
    return { data: rows[0], error: null };
  }

  // Terminator: zero or one row, no error on zero.
  async maybeSingle() {
    const rows = await this.exec();
    return { data: rows[0] ?? null, error: null };
  }

  // Awaitable directly → array of rows / completion of update or insert.
  then<R1 = { data: unknown; error: Error | null }, R2 = never>(
    resolve: (value: { data: unknown; error: Error | null }) => R1 | PromiseLike<R1>,
    reject?: (reason: unknown) => R2 | PromiseLike<R2>,
  ): Promise<R1 | R2> {
    return this.exec()
      .then((rows) => resolve({ data: rows, error: null }))
      .catch((err) =>
        reject ? reject(err) : Promise.reject(err),
      ) as Promise<R1 | R2>;
  }

  private async exec(): Promise<Row[]> {
    const tbl = db[this.table];

    if (this.op === "insert") {
      tbl.push(...this.rowsToInsert);
      return this.rowsToInsert;
    }

    if (this.op === "update") {
      const matches = tbl.filter((r) =>
        this.filters.every(([c, v]) => r[c] === v),
      );
      for (const row of matches) Object.assign(row, this.patch);
      return matches;
    }

    // select
    let rows = tbl.filter((r) =>
      this.filters.every(([c, v]) => r[c] === v),
    );
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      rows = [...rows].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }
}

export function makeMockSupabase() {
  return {
    from: (table: keyof Db) => new Query(table),
  };
}
