import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  picture: text("picture").default(""),
  role: text("role").notNull().default("client"),
  ffName: text("ff_name").default(""),
  ffId: text("ff_id").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
