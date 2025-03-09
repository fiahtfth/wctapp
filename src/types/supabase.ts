export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: number
          text: string
          answer: string
          subject: string
          topic: string
          question_type: string
          explanation: string
          module_name: string
          difficulty_level: string
          nature_of_question: string
          sub_topic: string
          faculty_approved: boolean
        }
        Insert: {
          id?: number
          text: string
          answer: string
          subject: string
          topic: string
          question_type: string
          explanation: string
          module_name: string
          difficulty_level: string
          nature_of_question: string
          sub_topic: string
          faculty_approved?: boolean
        }
        Update: {
          id?: number
          text?: string
          answer?: string
          subject?: string
          topic?: string
          question_type?: string
          explanation?: string
          module_name?: string
          difficulty_level?: string
          nature_of_question?: string
          sub_topic?: string
          faculty_approved?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
