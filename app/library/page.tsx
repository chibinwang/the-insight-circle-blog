'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { BookCard } from '@/components/book-card';
import { FamousPersonCard } from '@/components/famous-person-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Library as LibraryIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [famousPeople, setFamousPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.is_admin || false;

  useEffect(() => {
    fetchBooks();
    fetchFamousPeople();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm]);

  const fetchBooks = async () => {
    setLoading(true);

    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      setLoading(false);
      return;
    }

    const booksWithCounts = await Promise.all(
      (booksData || []).map(async (book) => {
        const { count } = await supabase
          .from('book_takeaways')
          .select('*', { count: 'exact', head: true })
          .eq('book_id', book.id);

        return {
          ...book,
          takeaway_count: count || 0,
        };
      })
    );

    setBooks(booksWithCounts);
    setLoading(false);
  };

  const fetchFamousPeople = async () => {
    setLoadingPeople(true);
    const { data: people } = await supabase
      .from('famous_people')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!people) {
      setLoadingPeople(false);
      return;
    }

    const peopleWithCounts = await Promise.all(
      people.map(async (person) => {
        const { count } = await supabase
          .from('famous_people_books')
          .select('*', { count: 'exact', head: true })
          .eq('famous_person_id', person.id);

        return {
          ...person,
          book_count: count || 0,
        };
      })
    );

    setFamousPeople(peopleWithCounts);
    setLoadingPeople(false);
  };

  const filterBooks = () => {
    if (!searchTerm.trim()) {
      setFilteredBooks(books);
      return;
    }

    const filtered = books.filter((book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredBooks(filtered);
  };

  const handleDeleteClick = (bookId: number) => {
    setBookToDelete(bookId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookToDelete);

      if (error) throw error;

      toast({
        title: '刪除成功',
        description: '書籍已成功刪除',
      });

      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除書籍，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <LibraryIcon className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold">圖書館</h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">
            探索精選書籍，分享閱讀心得，建立屬於你的書單
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="all" className="gap-2">
              <LibraryIcon className="h-4 w-4" />
              所有書籍
            </TabsTrigger>
            <TabsTrigger value="famous" className="gap-2">
              <Sparkles className="h-4 w-4" />
              名人書單
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜尋書名或作者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isAdmin && (
                <Link href="/admin/library/create">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    新增書籍
                  </Button>
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <LibraryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? '找不到符合的書籍' : '圖書館目前沒有書籍'}
                </p>
                {isAdmin && !searchTerm && (
                  <Link href="/admin/library/create">
                    <Button className="mt-4">新增第一本書</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} onDelete={handleDeleteClick} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="famous" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <p className="text-gray-600">
                探索各領域傑出人士的精選書單，從他們推薦的書籍中獲得啟發與智慧
              </p>
              {isAdmin && (
                <Link href="/admin/famous-people/create">
                  <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    新增名人
                  </Button>
                </Link>
              )}
            </div>

            {loadingPeople ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : famousPeople.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">目前還沒有名人書單</p>
                {isAdmin && (
                  <Link href="/admin/famous-people/create">
                    <Button className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600">
                      新增第一位名人
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {famousPeople.map((person) => (
                  <FamousPersonCard key={person.id} person={person} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除這本書嗎？此操作將同時刪除所有相關的摘要和讀後感，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
