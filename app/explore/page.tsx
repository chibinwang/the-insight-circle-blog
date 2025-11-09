'use client';

import { useState, useEffect } from 'react';
import { supabase, POST_CATEGORIES, type PostCategory } from '@/lib/supabase';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type SortOption = 'date' | 'popularity';

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as PostCategory | null;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>(
    categoryParam || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, sortBy]);

  const fetchPosts = async () => {
    setLoading(true);

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('is_published', true)
      .eq('scheduling_status', 'published');

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query
        .order('like_count', { ascending: false })
        .order('view_count', { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      setPosts(data);
    }

    setLoading(false);
  };

  const getCategoryTitle = () => {
    if (selectedCategory === 'all') return '探索';
    return selectedCategory;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{getCategoryTitle()}</h1>
          <p className="text-gray-600 text-lg mb-8">
            探索並分享來自我們社群的精彩故事
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                所有文章
              </Button>
              {POST_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">排序：</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">發布時間</SelectItem>
                  <SelectItem value="popularity">熱門程度</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">此分類中暫無文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
