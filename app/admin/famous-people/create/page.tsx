'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CoverImageUpload } from '@/components/cover-image-upload';

export default function CreateFamousPersonPage() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile?.is_admin) {
      toast({
        title: '權限不足',
        description: '您沒有權限執行此操作',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: '請填寫姓名',
        description: '名人姓名為必填欄位',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('famous_people')
        .insert({
          name: name.trim(),
          bio: bio.trim() || null,
          category: category.trim() || null,
          profile_image_url: profileImageUrl.trim() || null,
          display_order: displayOrder,
          is_published: isPublished,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '創建成功',
        description: '名人已成功創建',
      });

      router.push(`/admin/famous-people/edit/${data.id}`);
    } catch (error) {
      console.error('Error creating famous person:', error);
      toast({
        title: '創建失敗',
        description: '無法創建名人，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-6">
          <Link href="/admin/famous-people">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">新增名人</h1>
          <p className="text-gray-600 mt-2">創建一位新的名人並管理他們的書單推薦</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：Bill Gates"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="category">類別</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="例如：企業家、作家、科學家"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="bio">簡介</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="簡短介紹這位名人的背景和成就..."
                  rows={4}
                  className="mt-1.5 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="profile_image">頭像圖片</Label>
                <div className="mt-1.5">
                  <CoverImageUpload
                    currentImage={profileImageUrl}
                    onImageUploaded={setProfileImageUrl}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  建議使用 1:1 比例的肖像照片
                </p>
              </div>

              <div>
                <Label htmlFor="display_order">顯示順序</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="mt-1.5"
                />
                <p className="text-sm text-gray-500 mt-1">
                  數字越小排序越前面
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="is_published" className="text-base">發佈狀態</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    關閉後將不會在前台顯示
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      創建中...
                    </>
                  ) : (
                    '創建名人'
                  )}
                </Button>
                <Link href="/admin/famous-people" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    取消
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
