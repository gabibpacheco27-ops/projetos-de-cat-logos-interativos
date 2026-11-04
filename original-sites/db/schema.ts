import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const catalog = sqliteTable('catalog', { id: text('id').primaryKey(), data: text('data').notNull() });
export const editors = sqliteTable('editors', { email: text('email').primaryKey(), role: text('role').notNull().default('editor') });
