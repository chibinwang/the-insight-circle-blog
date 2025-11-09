'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase, POST_CATEGORIES, type PostCategory } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { AudioUpload } from '@/components/audio-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [audioFileUrl, setAudioFileUrl] = useState('');
  const [category, setCategory] = useState<PostCategory>('AI News');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  const handleCoverImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: '錯誤',
        description: '請選擇圖片檔案（JPG、PNG等）',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '錯誤',
        description: '圖片大小必須小於5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingCover(true);
    setCoverImageFile(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: '錯誤',
        description: '上傳封面圖片失敗',
        variant: 'destructive',
      });
      setUploadingCover(false);
      return;
    }

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    setCoverImage(data.publicUrl);
    setUploadingCover(false);

    toast({
      title: '成功',
      description: '封面圖片上傳成功',
    });
  };

  const handleRemoveCoverImage = () => {
    setCoverImage('');
    setCoverImageFile(null);
  };

  const handleRemoveAudio = () => {
    setAudioFileUrl('');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = generateSlug(title) + '-' + Date.now();

    const { error } = await supabase.from('posts').insert([
      {
        author_id: user.id,
        title,
        slug,
        content,
        cover_image: coverImage || null,
        audio_file_url: audioFileUrl || null,
        category,
        is_published: true,
      },
    ]);

    if (error) {
      toast({
        title: '錯誤',
        description: '建立文章失敗',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: '成功',
      description: '文章建立成功',
    });

    router.push(`/post/${slug}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">建立新文章</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">標題</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="輸入文章標題"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>封面圖片（選填）</Label>
                <div className="space-y-3">
                  {coverImage ? (
                    <div className="relative">
                      <img
                        src={coverImage}
                        alt="封面預覽"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveCoverImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleCoverImageFileChange}
                          disabled={uploadingCover}
                          className="flex-1"
                          id="coverImageFile"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('coverImageFile')?.click()}
                          disabled={uploadingCover}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingCover ? '上傳中...' : '上傳'}
                        </Button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">或使用網址</span>
                        </div>
                      </div>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">分類</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as PostCategory)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">內容</Label>
                <Textarea
                  id="content"
                  placeholder="寫下您的故事..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={15}
                  className="resize-y"
                />
              </div>

              <AudioUpload
                audioUrl={audioFileUrl}
                onAudioChange={setAudioFileUrl}
                onAudioRemove={handleRemoveAudio}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? '發布中...' : '發布文章'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
