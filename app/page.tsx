import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/post-card';
import { SubscriptionForm } from '@/components/subscription-form';
import { JoinGroupButton } from '@/components/join-group-button';
import { cache } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const getPosts = cache(async () => {
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

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return posts || [];
});

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900">最新文章</h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            探索並分享來自我們社群的精彩故事
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-gray-500 text-base sm:text-lg">目前還沒有文章。成為第一個分享你的故事的人吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="mt-16 sm:mt-20 lg:mt-24 max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-400 rounded-full blur-3xl opacity-20"></div>

            <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12">
              <div className="text-center mb-8 sm:mb-10">
                <div className="inline-block p-3 sm:p-4 rounded-full bg-slate-600/50 mb-4 sm:mb-6">
                  <svg className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">加入思圈社群</h2>
                <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 text-slate-100 max-w-2xl mx-auto leading-relaxed px-4">
                  與其他讀者一起交流討論，分享你的想法與見解
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 text-center border border-slate-500/30 hover:bg-slate-800/60 transition-colors">
                  <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-base sm:text-lg">即時對話</h3>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    參與即時討論，快速獲得回應
                  </p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 text-center border border-slate-500/30 hover:bg-slate-800/60 transition-colors">
                  <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-base sm:text-lg">活躍社群</h3>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    認識志同道合的夥伴
                  </p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 text-center border border-slate-500/30 hover:bg-slate-800/60 transition-colors">
                  <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-base sm:text-lg">深度交流</h3>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    分享見解，共同成長
                  </p>
                </div>
              </div>

              <div className="text-center">
                <JoinGroupButton
                  groupId={1}
                  variant="outline"
                  size="lg"
                  className="bg-white text-slate-800 hover:bg-slate-50 border-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                />
                <p className="text-slate-200 text-xs sm:text-sm mt-3 sm:mt-4 px-4">
                  完全免費，只需一鍵即可加入
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8 md:p-10 lg:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">訂閱我們的電子報</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              將最新文章直接送到您的信箱。立即加入我們的讀者社群！
            </p>
            <SubscriptionForm className="max-w-md mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
