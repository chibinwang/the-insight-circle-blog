import { supabase } from '@/lib/supabase';
import { FamousPersonCard } from '@/components/famous-person-card';
import { Users, Sparkles } from 'lucide-react';

export const revalidate = 0;

async function getFamousPeople() {
  const { data: people } = await supabase
    .from('famous_people')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (!people) return [];

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

  return peopleWithCounts;
}

export default async function FamousPeoplePage() {
  const people = await getFamousPeople();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-10 sm:mb-12 lg:mb-16 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            名人書單
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            探索各領域傑出人士的精選書單，從他們推薦的書籍中獲得啟發與智慧
          </p>
        </div>

        {people.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
              <Users className="h-10 w-10 text-amber-600" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg">目前還沒有名人書單</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {people.map((person) => (
              <FamousPersonCard key={person.id} person={person} />
            ))}
          </div>
        )}

        <div className="mt-16 sm:mt-20 lg:mt-24 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 rounded-2xl shadow-xl overflow-hidden relative p-8 sm:p-12 text-center border-2 border-amber-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-300 rounded-full blur-3xl opacity-20"></div>

            <div className="relative z-10">
              <Sparkles className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">受到啟發了嗎？</h2>
              <p className="text-gray-700 text-base sm:text-lg mb-6 max-w-xl mx-auto">
                從這些傑出人士的閱讀清單中，找到您的下一本啟發之書
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
