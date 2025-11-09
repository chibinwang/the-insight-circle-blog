'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FamousPerson } from '@/lib/supabase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, User, Edit, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type FamousPersonCardProps = {
  person: FamousPerson & { book_count?: number };
  onDelete?: (personId: number) => void;
};

export function FamousPersonCard({ person, onDelete }: FamousPersonCardProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin || false;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out h-full relative group cursor-pointer border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="absolute -top-3 -right-3 z-10">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2 shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="absolute top-3 left-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isAdmin && (
          <>
            <Link href={`/admin/famous-people/edit/${person.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="sm" className="gap-1 shadow-lg hover:shadow-xl transition-shadow">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">編輯</span>
              </Button>
            </Link>
            {onDelete && (
              <div onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(person.id)}
                  className="gap-1 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Link href={`/famous-people/${person.id}`}>
        <div className="relative">
          {person.profile_image_url ? (
            <div className="relative w-full h-80 overflow-hidden rounded-t-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 via-transparent to-transparent z-10"></div>
              <img
                src={person.profile_image_url}
                alt={person.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-1">
                  {person.name}
                </h2>
                {person.category && (
                  <Badge className="bg-amber-500 text-white border-0 shadow-md">
                    {person.category}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-80 overflow-hidden rounded-t-lg bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-100 flex flex-col items-center justify-center">
              <User className="h-32 w-32 text-amber-400 mb-4" />
              <h2 className="text-3xl font-bold text-amber-900 px-4 text-center mb-2">
                {person.name}
              </h2>
              {person.category && (
                <Badge className="bg-amber-500 text-white border-0 shadow-md">
                  {person.category}
                </Badge>
              )}
            </div>
          )}
        </div>

        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">精選推薦</span>
          </div>
          {person.bio && (
            <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
              {person.bio}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-3 pb-5 border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700">
              <BookOpen className="h-5 w-5" />
              <span className="font-semibold">{person.book_count || 0} 本書</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium uppercase tracking-wide">
              <span>查看書單</span>
              <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
