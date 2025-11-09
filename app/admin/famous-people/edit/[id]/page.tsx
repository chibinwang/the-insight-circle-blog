'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CoverImageUpload } from '@/components/cover-image-upload';
import { BookCard } from '@/components/book-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EditFamousPersonPage() {
  const params = useParams();
  const id = params.id as string;
  const [person, setPerson] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile?.is_admin) {
      router.push('/');
      return;
    }
    fetchPerson();
    fetchBooks();
    fetchAllBooks();
  }, [id, profile]);

  const fetchPerson = async () => {
    const { data, error } = await supabase
      .from('famous_people')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching person:', error);
      toast({
        title: '載入失敗',
        description: '無法載入名人資料',
        variant: 'destructive',
      });
      router.push('/admin/famous-people');
      return;
    }

    setPerson(data);
    setName(data.name);
    setBio(data.bio || '');
    setCategory(data.category || '');
    setProfileImageUrl(data.profile_image_url || '');
    setDisplayOrder(data.display_order || 0);
    setIsPublished(data.is_published);
    setLoading(false);
  };

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('famous_people_books')
      .select(`
        *,
        books (*)
      `)
      .eq('famous_person_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    const validBooks = data?.filter(item => item.books !== null).map(item => item.books) || [];
    setBooks(validBooks);
  };

  const fetchAllBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all books:', error);
      return;
    }

    setAllBooks(data || []);
  };

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

    setSaving(true);

    try {
      const { error } = await supabase
        .from('famous_people')
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          category: category.trim() || null,
          profile_image_url: profileImageUrl.trim() || null,
          display_order: displayOrder,
          is_published: isPublished,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '更新成功',
        description: '名人資料已成功更新',
      });

      fetchPerson();
    } catch (error) {
      console.error('Error updating person:', error);
      toast({
        title: '更新失敗',
        description: '無法更新名人資料，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBook = async (bookId: number) => {
    try {
      const { error } = await supabase
        .from('famous_people_books')
        .insert({
          famous_person_id: parseInt(id),
          book_id: bookId,
          added_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: '新增成功',
        description: '書籍已加入書單',
      });

      fetchBooks();
      setAddBookDialogOpen(false);
      setSearchTerm('');
    } catch (error: any) {
      console.error('Error adding book:', error);
      if (error.code === '23505') {
        toast({
          title: '此書已在書單中',
          description: '此書籍已經在此名人的書單中',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '新增失敗',
          description: '無法新增書籍，請稍後再試',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveBook = async (bookId: number) => {
    try {
      const { error } = await supabase
        .from('famous_people_books')
        .delete()
        .eq('famous_person_id', id)
        .eq('book_id', bookId);

      if (error) throw error;

      toast({
        title: '移除成功',
        description: '書籍已從書單中移除',
      });

      fetchBooks();
    } catch (error) {
      console.error('Error removing book:', error);
      toast({
        title: '移除失敗',
        description: '無法移除書籍，請稍後再試',
        variant: 'destructive',
      });
    }
  };

  const filteredAvailableBooks = allBooks.filter(book => {
    const alreadyAdded = books.some(b => b.id === book.id);
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

  if (loading || !profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-6">
          <Link href="/admin/famous-people">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">編輯名人</h1>
          <p className="text-gray-600 mt-2">管理名人資料和書單推薦</p>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">基本資訊</TabsTrigger>
            <TabsTrigger value="books">書單管理</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
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
                  </div>

                  <div>
                    <Label htmlFor="display_order">顯示順序</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                      className="mt-1.5"
                    />
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
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          儲存中...
                        </>
                      ) : (
                        '儲存變更'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>書單管理 ({books.length} 本書)</CardTitle>
                  <Dialog open={addBookDialogOpen} onOpenChange={setAddBookDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                        <Plus className="h-4 w-4" />
                        新增書籍
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>選擇書籍加入書單</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="搜尋書名或作者..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                          {filteredAvailableBooks.length === 0 ? (
                            <p className="text-gray-500 col-span-2 text-center py-8">
                              {searchTerm ? '找不到符合的書籍' : '所有書籍都已加入書單'}
                            </p>
                          ) : (
                            filteredAvailableBooks.map((book) => (
                              <div key={book.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleAddBook(book.id)}>
                                <div className="flex gap-3">
                                  {book.cover_image_url && (
                                    <img src={book.cover_image_url} alt={book.title} className="w-16 h-20 object-cover rounded" />
                                  )}
                                  <div className="flex-1">
                                    <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {books.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">此名人的書單還沒有任何書籍</p>
                    <Button onClick={() => setAddBookDialogOpen(true)} className="bg-gradient-to-r from-amber-500 to-orange-600">
                      新增第一本書
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map((book) => (
                      <div key={book.id} className="relative">
                        <div className="absolute -top-2 -right-2 z-10">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={() => handleRemoveBook(book.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
