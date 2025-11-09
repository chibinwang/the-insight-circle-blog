'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { BookTakeawayForm } from '@/components/book-takeaway-form';
import { AddToBookListButton } from '@/components/add-to-book-list-button';
import { UserTitleBadge } from '@/components/user-title-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  Pin,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { notFound } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function BookDetailPage({ params }: { params: { bookId: string } }) {
  const [book, setBook] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [takeaways, setTakeaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);
  const [editingTakeaway, setEditingTakeaway] = useState<number | null>(null);
  const [editTakeawayContent, setEditTakeawayContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [takeawayToDelete, setTakeawayToDelete] = useState<number | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.is_admin || false;

  useEffect(() => {
    fetchBookDetails();
  }, [params.bookId]);

  const fetchBookDetails = async () => {
    setLoading(true);

    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', params.bookId)
      .maybeSingle();

    if (bookError || !bookData) {
      console.error('Error fetching book:', bookError);
      notFound();
      return;
    }

    const { data: summaryData } = await supabase
      .from('book_summaries')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('book_id', params.bookId)
      .maybeSingle();

    const { data: takeawaysData } = await supabase
      .from('book_takeaways')
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          user_title
        )
      `)
      .eq('book_id', params.bookId)
      .order('created_at', { ascending: false });

    setBook(bookData);
    setSummary(summaryData);
    setSummaryContent(summaryData?.content || '');
    setTakeaways(takeawaysData || []);
    setLoading(false);
  };

  const handleSaveSummary = async () => {
    if (!summaryContent.trim()) {
      toast({
        title: '內容不能為空',
        description: '請輸入摘要內容',
        variant: 'destructive',
      });
      return;
    }

    setSavingSummary(true);

    try {
      if (summary) {
        const { error } = await supabase
          .from('book_summaries')
          .update({ content: summaryContent.trim() })
          .eq('id', summary.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('book_summaries')
          .insert({
            book_id: params.bookId,
            admin_id: user!.id,
            content: summaryContent.trim(),
          });

        if (error) throw error;
      }

      toast({
        title: '保存成功',
        description: '書籍摘要已成功保存',
      });

      setEditingSummary(false);
      fetchBookDetails();
    } catch (error) {
      console.error('Error saving summary:', error);
      toast({
        title: '保存失敗',
        description: '無法保存摘要，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setSavingSummary(false);
    }
  };

  const handleDeleteTakeaway = async () => {
    if (!takeawayToDelete) return;

    try {
      const { error } = await supabase
        .from('book_takeaways')
        .delete()
        .eq('id', takeawayToDelete);

      if (error) throw error;

      toast({
        title: '刪除成功',
        description: '讀後感已成功刪除',
      });

      fetchBookDetails();
    } catch (error) {
      console.error('Error deleting takeaway:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除讀後感，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTakeawayToDelete(null);
    }
  };

  const handleEditTakeaway = async (takeawayId: number) => {
    if (!editTakeawayContent.trim()) {
      toast({
        title: '內容不能為空',
        description: '請輸入讀後感內容',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('book_takeaways')
        .update({ content: editTakeawayContent.trim() })
        .eq('id', takeawayId);

      if (error) throw error;

      toast({
        title: '更新成功',
        description: '讀後感已成功更新',
      });

      setEditingTakeaway(null);
      fetchBookDetails();
    } catch (error) {
      console.error('Error updating takeaway:', error);
      toast({
        title: '更新失敗',
        description: '無法更新讀後感，請稍後再試',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!book) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/library">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回圖書館
            </Button>
          </Link>

          {isAdmin && (
            <Link href={`/admin/library/edit/${book.id}`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                編輯書籍
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {book.cover_image_url ? (
              <div className="flex-shrink-0">
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full md:w-64 h-auto rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-full md:w-64 h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <BookOpen className="h-20 w-20 text-blue-400" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-6">作者：{book.author}</p>

              {book.description && (
                <p className="text-gray-700 mb-6 leading-relaxed">{book.description}</p>
              )}

              {book.isbn && (
                <p className="text-sm text-gray-500 mb-6">ISBN: {book.isbn}</p>
              )}

              <AddToBookListButton bookId={book.id} size="lg" />
            </div>
          </div>
        </div>

        {(summary || isAdmin) && (
          <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pin className="h-5 w-5 text-blue-600" />
                  <h2 className="text-2xl font-bold text-blue-900">管理員書評</h2>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSummary(!editingSummary);
                      if (!editingSummary) {
                        setSummaryContent(summary?.content || '');
                      }
                    }}
                    className="gap-2"
                  >
                    {editingSummary ? (
                      <>
                        <X className="h-4 w-4" />
                        取消
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        編輯
                      </>
                    )}
                  </Button>
                )}
              </div>

              {editingSummary ? (
                <div className="space-y-4">
                  <Textarea
                    value={summaryContent}
                    onChange={(e) => setSummaryContent(e.target.value)}
                    placeholder="輸入書籍摘要..."
                    rows={10}
                    className="resize-none bg-white"
                  />
                  <Button
                    onClick={handleSaveSummary}
                    disabled={savingSummary}
                    className="gap-2"
                  >
                    {savingSummary ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        保存摘要
                      </>
                    )}
                  </Button>
                </div>
              ) : summary ? (
                <div className="prose max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {summary.content}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">尚未撰寫書評</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-bold mb-6">讀者心得</h2>
          <BookTakeawayForm bookId={parseInt(params.bookId)} onTakeawayAdded={fetchBookDetails} />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">所有讀後感 ({takeaways.length})</h2>

          {takeaways.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                還沒有人分享讀後感，成為第一個分享的人吧！
              </CardContent>
            </Card>
          ) : (
            takeaways.map((takeaway) => (
              <Card key={takeaway.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {takeaway.profiles?.avatar_url ? (
                          <img
                            src={takeaway.profiles.avatar_url}
                            alt={takeaway.profiles.username || 'User'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{takeaway.profiles?.username || 'Anonymous'}</p>
                          {takeaway.profiles?.user_title && (
                            <UserTitleBadge title={takeaway.profiles.user_title} size="sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(takeaway.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {user?.id === takeaway.user_id && (
                      <div className="flex gap-2">
                        {editingTakeaway === takeaway.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTakeaway(takeaway.id)}
                              className="gap-1"
                            >
                              <Save className="h-4 w-4" />
                              保存
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTakeaway(null)}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              取消
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTakeaway(takeaway.id);
                                setEditTakeawayContent(takeaway.content);
                              }}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              編輯
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTakeawayToDelete(takeaway.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              刪除
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {editingTakeaway === takeaway.id ? (
                    <Textarea
                      value={editTakeawayContent}
                      onChange={(e) => setEditTakeawayContent(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {takeaway.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除這篇讀後感嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTakeaway} className="bg-red-600 hover:bg-red-700">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
