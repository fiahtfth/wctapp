import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";

export const tests = pgTable("tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  batch: text("batch").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  questionCount: integer("question_count").default(0).notNull(),
  // Add any additional fields as needed
});

export type Test = typeof tests.$inferSelect;
export type NewTest = typeof tests.$inferInsert;
