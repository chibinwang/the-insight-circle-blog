import { supabase } from '@/lib/supabase';
import { BookCard } from '@/components/book-card';
import { ArrowLeft, User, Sparkles, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const revalidate = 0;

async function getFamousPerson(id: string) {
  const { data: person } = await supabase
    .from('famous_people')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  return person;
}

async function getPersonBooks(id: string) {
  const { data: bookLinks } = await supabase
    .from('famous_people_books')
    .select(`
      *,
      books (*)
    `)
    .eq('famous_person_id', id)
    .order('display_order', { ascending: true });

  if (!bookLinks) return [];

  const validBookLinks = bookLinks.filter(link => link.books !== null);

  const booksWithCounts = await Promise.all(
    validBookLinks.map(async (link) => {
      const book = link.books;
      const { count } = await supabase
        .from('book_takeaways')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', book.id);

      return {
        ...book,
        takeaway_count: count || 0,
        recommendation_note: link.recommendation_note,
      };
    })
  );

  return booksWithCounts;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const person = await getFamousPerson(id);

  if (!person) {
    return {
      title: 'Famous Person Not Found',
    };
  }

  return {
    title: `${person.name} - 名人書單`,
    description: person.bio || `探索 ${person.name} 的精選書單`,
  };
}

export default async function FamousPersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getFamousPerson(id);

  if (!person) {
    notFound();
  }

  const books = await getPersonBooks(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/famous-people">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            返回名人書單
          </Button>
        </Link>

        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-amber-200">
            <div className="relative">
              {person.profile_image_url ? (
                <div className="relative h-64 sm:h-80 lg:h-96">
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/70 via-amber-900/30 to-transparent z-10"></div>
                  <img
                    src={person.profile_image_url}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      {person.category && (
                        <Badge className="bg-amber-500 text-white border-0 shadow-md text-sm">
                          {person.category}
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                      {person.name}
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="relative h-64 sm:h-80 bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-100 flex flex-col items-center justify-center p-8">
                  <User className="h-24 w-24 sm:h-32 sm:w-32 text-amber-400 mb-4" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    {person.category && (
                      <Badge className="bg-amber-500 text-white border-0 shadow-md">
                        {person.category}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-900 text-center">
                    {person.name}
                  </h1>
                </div>
              )}
            </div>

            {person.bio && (
              <div className="p-6 sm:p-8 border-t-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="max-w-4xl">
                  <h2 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <div className="h-1 w-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                    關於 {person.name}
                  </h2>
                  <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                    {person.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-8 w-8 text-amber-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              推薦書單
            </h2>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
              {books.length} 本書
            </Badge>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border-2 border-amber-100">
            <BookOpen className="h-16 w-16 text-amber-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">此書單目前沒有書籍</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {books.map((book) => (
              <div key={book.id}>
                <BookCard book={book} />
                {book.recommendation_note && (
                  <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                    <p className="text-sm text-gray-700 italic">
                      {book.recommendation_note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link href="/famous-people">
            <Button variant="outline" className="gap-2 border-2 border-amber-300 hover:bg-amber-50">
              <ArrowLeft className="h-4 w-4" />
              瀏覽更多名人書單
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
