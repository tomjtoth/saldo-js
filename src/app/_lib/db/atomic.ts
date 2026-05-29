import { spawn } from "child_process";
import { sql } from "drizzle-orm";

import { VDate } from "../utils";
import { db, getDbPath } from "./instance";
import { schema } from "./relations";
import { DbRevision, DbUser, DrizzleTx } from "./types";

const DB_BACKUP_EVERY_N_REVISIONS = parseInt(
  process.env.DB_BACKUP_EVERY_N_REVISIONS ?? "0",
);

type Operation<T> = (tx: DrizzleTx, revisionId: DbRevision["id"]) => Promise<T>;

export async function atomic<T>(
  revisedById: DbUser["id"],
  operation: Operation<T>,
): Promise<T> {
  let revisionId = -1;

  const res = await db.transaction(async (tx) => {
    if (revisedById === -1) await tx.run(sql`PRAGMA defer_foreign_keys = ON`);

    [{ revisionId }] = await tx
      .insert(schema.revisions)
      .values([
        {
          createdById: revisedById,
          createdAt: VDate.timeToStr(),
        },
      ])
      .returning({ revisionId: schema.revisions.id });

    return operation(tx, revisionId);
  });

  if (
    !process.env.AUTH_URL?.startsWith("https://staging") &&
    DB_BACKUP_EVERY_N_REVISIONS > 0 &&
    revisionId % DB_BACKUP_EVERY_N_REVISIONS === 0
  ) {
    const dbPath = getDbPath();
    const bakFile = `${dbPath}.at.${revisionId}`;
    await db.run(sql`VACUUM INTO ${sql.raw(`'${bakFile}'`)}`);
    spawn("xz", ["-9", bakFile], {
      stdio: "ignore",
      detached: true,
    });
  }

  return res;
}
