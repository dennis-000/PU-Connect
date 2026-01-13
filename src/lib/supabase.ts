import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
  department?: string;
  faculty?: string;
  phone?: string;
  avatar_url?: string;
  role: 'buyer' | 'seller' | 'admin' | 'super_admin' | 'news_publisher';
  is_active: boolean;
  last_seen?: string;
  is_online?: boolean;
  created_at: string;
  updated_at: string;
};

export type SellerApplication = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string;
  business_description: string;
  contact_phone: string;
  contact_email?: string;
  business_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  price_type: 'fixed' | 'contact';
  images?: string[];
  whatsapp_number?: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
};
