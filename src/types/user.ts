export interface User {
  id?: number;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  password?: string;
  username?: string;
  is_active?: boolean;
  last_login?: string | null;
}
