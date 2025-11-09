import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        username,
        user_title
      )
    `)
    .eq('is_published', true)
    .eq('scheduling_status', 'published')
    .order('created_at', { ascending: false });

  return NextResponse.json({
    success: !error,
    count: posts?.length || 0,
    posts: posts?.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      is_published: p.is_published,
      scheduling_status: p.scheduling_status
    })) || [],
    error: error?.message
  });
}
