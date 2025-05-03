import { pgTable, text, serial, integer, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from the original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Mood types for the application
export const moodTypes = ["calm", "energetic", "focused", "playful", "serious"] as const;
export type MoodType = typeof moodTypes[number];

// Node types for the inspiration cards
export const nodeTypes = ["sketch", "image", "audio", "thought", "link"] as const;
export type NodeType = typeof nodeTypes[number];

// Tag category types
export const tagCategories = ["UX Flow", "Visual", "Ambient", "Intent"] as const;
export type TagCategory = typeof tagCategories[number];

// Projects schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Mood boards schema
export const moodBoards = pgTable("mood_boards", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMoodBoardSchema = createInsertSchema(moodBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Inspiration nodes schema
export const inspirationNodes = pgTable("inspiration_nodes", {
  id: serial("id").primaryKey(),
  moodBoardId: integer("mood_board_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  contentUrl: text("content_url"),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  width: integer("width").default(320),
  height: integer("height"),
  zIndex: integer("z_index").default(1),
  mood: varchar("mood", { length: 20 }).notNull(),
  intensity: integer("intensity").notNull().default(50),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInspirationNodeSchema = createInsertSchema(inspirationNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Node connections schema
export const nodeConnections = pgTable("node_connections", {
  id: serial("id").primaryKey(),
  sourceNodeId: integer("source_node_id").notNull(),
  targetNodeId: integer("target_node_id").notNull(),
  strength: integer("strength").default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNodeConnectionSchema = createInsertSchema(nodeConnections).omit({
  id: true,
  createdAt: true,
});

// Team mood records
export const teamMoods = pgTable("team_moods", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  mood: varchar("mood", { length: 20 }).notNull(),
  intensity: integer("intensity").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamMoodSchema = createInsertSchema(teamMoods).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertMoodBoard = z.infer<typeof insertMoodBoardSchema>;
export type MoodBoard = typeof moodBoards.$inferSelect;

export type InsertInspirationNode = z.infer<typeof insertInspirationNodeSchema>;
export type InspirationNode = typeof inspirationNodes.$inferSelect;

export type InsertNodeConnection = z.infer<typeof insertNodeConnectionSchema>;
export type NodeConnection = typeof nodeConnections.$inferSelect;

export type InsertTeamMood = z.infer<typeof insertTeamMoodSchema>;
export type TeamMood = typeof teamMoods.$inferSelect;
