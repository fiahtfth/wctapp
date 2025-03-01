import { 
  pgTable, 
  text, 
  timestamp, 
  integer, 
  uuid 
} from 'drizzle-orm/pg-core';

export const tests = pgTable('tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  batch: text('batch').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  questionCount: integer('question_count').default(0).notNull(),
  // Add any additional fields as needed
});

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Test = typeof tests.$inferSelect;
export type NewTest = typeof tests.$inferInsert;

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: number;
          text: string;
          answer: string;
          explanation: string | null;
          subject: string;
          module_name: string;
          topic: string;
          sub_topic: string | null;
          difficulty_level: string;
          question_type: string;
          nature_of_question: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          text: string;
          answer: string;
          explanation?: string | null;
          subject: string;
          module_name: string;
          topic: string;
          sub_topic?: string | null;
          difficulty_level: string;
          question_type: string;
          nature_of_question?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          text?: string;
          answer?: string;
          explanation?: string | null;
          subject?: string;
          module_name?: string;
          topic?: string;
          sub_topic?: string | null;
          difficulty_level?: string;
          question_type?: string;
          nature_of_question?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: []
      };
      users: {
        Row: {
          id: number;
          username: string;
          email: string;
          password_hash: string;
          role: string;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          username: string;
          email: string;
          password_hash: string;
          role: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          username?: string;
          email?: string;
          password_hash?: string;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: []
      };
      user_tokens: {
        Row: {
          id: number;
          user_id: number;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: number;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: number;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_tokens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ]
      };
      carts: {
        Row: {
          id: number;
          test_id: string;
          user_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          test_id: string;
          user_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          test_id?: string;
          user_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ]
      };
      cart_items: {
        Row: {
          id: number;
          cart_id: number;
          question_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          cart_id: number;
          question_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          cart_id?: number;
          question_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          }
        ]
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
