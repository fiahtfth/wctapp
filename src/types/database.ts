import type { Question } from './question';

export interface QuestionsResult {
  questions?: Question[];
  totalPages?: number;
  error?: {
    message: string;
  } | null;
}

export interface DatabaseError {
  message: string;
  details?: string;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
}
