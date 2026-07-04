export type UserRole = 'admin' | 'visitor';

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  language?: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface AuthResponse {
  jwt_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}
