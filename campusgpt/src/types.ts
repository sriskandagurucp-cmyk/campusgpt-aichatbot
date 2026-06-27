export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'admin';
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  response: string;
  category: string;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  totalChats: number;
  users: User[];
  recentChats: (ChatMessage & { username: string; email: string })[];
  categoryStats: { category: string; count: number }[];
}

export type CategoryChip = {
  label: string;
  icon: string;
  prompt: string;
  category: string;
};
