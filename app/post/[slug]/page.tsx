import { supabase } from '@/lib/supabase';
import { LikeButton } from '@/components/like-button';
import { CommentSection } from '@/components/comment-section';
import { ShareButton } from '@/components/share-button';
import { DeletePostButton } from '@/components/delete-post-button';
import { JoinGroupButton } from '@/components/join-group-button';
import { PostContent } from '@/components/post-content';
import { SaveArticleButton } from '@/components/save-article-button';
import { Calendar, User, ArrowLeft, Edit, Music } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Metadata } from 'next';

export const revalidate = 0;

async function getPost(slug: string) {
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('scheduling_status', 'published')
    .maybeSingle();

  return post;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const keywords = post.keywords ? post.keywords.split(',').map((k: string) => k.trim()) : [];
  const description = post.content.replace(/<[^>]*>/g, '').substring(0, 160);

  return {
    title: post.title,
    description,
    keywords,
    openGraph: {
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : [],
      type: 'article',
      publishedTime: post.created_at,
      authors: [post.profiles?.username || 'Anonymous'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

  const accessToken = allCookies.find(
    cookie => cookie.name.includes('access_token') || cookie.name.includes('auth-token')
  )?.value;

  if (!accessToken) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser(accessToken);

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return { ...user, isAdmin: profile?.is_admin || false };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}


export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const currentUser = await getCurrentUser();

  if (!post) {
    notFound();
  }

  const isAdmin = currentUser?.isAdmin || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          {isAdmin && (
            <div className="flex gap-2">
              <Link href={`/admin/edit/${post.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <DeletePostButton postId={post.id} />
            </div>
          )}
        </div>

        <article className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          {post.cover_image && (
            <div className="relative w-full h-96 mb-8 -mx-8 md:-mx-12 -mt-8 md:-mt-12 rounded-t-lg overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          {post.audio_file_url && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Audio Companion</h3>
                  <p className="text-sm text-gray-600">Listen to this article</p>
                </div>
              </div>
              <audio
                controls
                className="w-full"
                src={post.audio_file_url}
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div className="flex items-center justify-between mb-8 pb-6 border-b">
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <Link
                  href={`/profile/${post.profiles?.username || post.author_id}`}
                  className="hover:underline"
                >
                  {post.profiles?.username || 'Anonymous'}
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <PostContent content={post.content} />
          </div>

          <div className="flex items-center space-x-4 pt-6 border-t">
            <LikeButton postId={post.id} />
            <SaveArticleButton postId={post.id} variant="outline" size="default" showText />
            <ShareButton />
          </div>
        </article>

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 mt-8">
          <CommentSection postId={post.id} />
        </div>

        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-xl shadow-2xl p-8 md:p-12 mt-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-3">想要討論這個主題？</h2>
            <p className="mb-6 text-blue-100">
              加入我們的社群討論區，與其他讀者深入交流
            </p>
            <JoinGroupButton
              groupId={1}
              variant="outline"
              size="lg"
              className="bg-white text-blue-900 hover:bg-blue-50 border-white font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
