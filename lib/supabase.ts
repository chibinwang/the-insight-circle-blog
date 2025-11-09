import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserTitle = 'dream_seeker' | 'path_builder' | 'creator' | 'strategist' | 'insight_leader';

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  user_title: UserTitle | null;
  created_at: string;
};

export type PostCategory = 'AI News' | 'Finance' | 'Study Overseas' | 'Entrepreneur Story' | 'Other';

export const POST_CATEGORIES: PostCategory[] = [
  'AI News',
  'Finance',
  'Study Overseas',
  'Entrepreneur Story',
  'Other'
];

export type SchedulingStatus = 'immediate' | 'scheduled' | 'published' | 'draft';

export type Post = {
  id: number;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  audio_file_url: string | null;
  category: PostCategory;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_email_sent?: boolean;
  email_sent_at?: string | null;
  scheduled_publish_at?: string | null;
  scheduling_status: SchedulingStatus;
  profiles?: Profile;
};

export type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type Like = {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
};

export type Subscriber = {
  id: number;
  email: string;
  is_subscribed: boolean;
  unsubscribe_token: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
};

export type EmailStat = {
  id: number;
  subscriber_id: number;
  post_id: number;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  tracking_token: string;
  created_at: string;
};

export type DiscussionGroup = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  id: number;
  group_id: number;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at: string;
  has_completed_onboarding: boolean;
  profiles?: Profile;
};

export type GroupMessage = {
  id: number;
  group_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  thread_id: number | null;
  message_type: 'message' | 'announcement' | 'system';
  parent_message_id: number | null;
  is_edited: boolean;
  profiles?: Profile;
};

export type DiscussionThread = {
  id: number;
  group_id: number;
  created_by: string | null;
  title: string;
  description: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  message_count: number;
  last_activity_at: string;
  created_at: string;
  profiles?: Profile;
};

export type DirectMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  sender?: Profile;
  receiver?: Profile;
};

export type Conversation = {
  user: Profile;
  last_message: DirectMessage;
  unread_count: number;
};

export type TitleInfo = {
  key: UserTitle;
  nameChinese: string;
  nameEnglish: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

export const USER_TITLES: Record<UserTitle, TitleInfo> = {
  dream_seeker: {
    key: 'dream_seeker',
    nameChinese: '夢想家',
    nameEnglish: 'Dream Seeker',
    description: '正在尋找人生方向、熱情，渴望突破的你',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
  path_builder: {
    key: 'path_builder',
    nameChinese: '行動者',
    nameEnglish: 'Path Builder',
    description: '已經在規劃路徑，嘗試實現夢想的你',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  creator: {
    key: 'creator',
    nameChinese: '創局者',
    nameEnglish: 'Creator',
    description: '已有事業雛形，專注打造屬於自己的價值系統',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  strategist: {
    key: 'strategist',
    nameChinese: '策略家',
    nameEnglish: 'Strategist',
    description: '理性規劃、懂得槓桿資源與時間',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  insight_leader: {
    key: 'insight_leader',
    nameChinese: '思行者',
    nameEnglish: 'Insight Leader',
    description: '管理者與社群領袖',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
  },
};

export const REGULAR_USER_TITLES: UserTitle[] = ['dream_seeker', 'path_builder', 'creator', 'strategist'];

export type Book = {
  id: number;
  title: string;
  author: string;
  cover_image_url: string | null;
  description: string | null;
  isbn: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BookSummary = {
  id: number;
  book_id: number;
  admin_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type BookTakeaway = {
  id: number;
  book_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type UserBookList = {
  id: number;
  user_id: string;
  book_id: number;
  added_at: string;
};

export type FamousPerson = {
  id: number;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  category: string | null;
  display_order: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FamousPersonBook = {
  id: number;
  famous_person_id: number;
  book_id: number;
  display_order: number;
  recommendation_note: string | null;
  added_by: string | null;
  added_at: string;
};
