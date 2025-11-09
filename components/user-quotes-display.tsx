'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Quote as QuoteIcon, Sparkles } from 'lucide-react';

interface QuoteData {
  id: number;
  text_chinese: string | null;
  text_english: string | null;
  language: string;
  is_custom?: boolean;
  created_by_user_id?: string | null;
}

interface UserQuotesDisplayProps {
  userId: string;
  className?: string;
}

export function UserQuotesDisplay({ userId, className = '' }: UserQuotesDisplayProps) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserQuotes();
  }, [userId]);

  async function loadUserQuotes() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_selected_quotes')
        .select(`
          quote_id,
          quotes (
            id,
            text_chinese,
            text_english,
            language
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const quotesData = data
        ?.map((item: any) => item.quotes)
        .filter(Boolean) || [];

      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading user quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-slate-200 rounded-lg mb-4 w-48"></div>
        <div className="space-y-3">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <QuoteIcon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">我的座右銘</h3>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {quotes.map((quote, index) => (
            <div
              key={quote.id}
              className="relative group animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute -left-2 top-0 bottom-0 w-1 rounded-full opacity-60 ${
                quote.is_custom
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                  : 'bg-gradient-to-b from-slate-400 to-slate-600'
              }`}></div>

              <blockquote className="pl-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {quote.language === 'chinese' ? (
                      <p className="text-xl md:text-2xl leading-relaxed text-slate-800 font-serif tracking-wide">
                        「{quote.text_chinese}」
                      </p>
                    ) : (
                      <p className="text-xl md:text-2xl leading-relaxed text-slate-800 font-serif italic tracking-wide">
                        "{quote.text_english}"
                      </p>
                    )}
                  </div>
                  {quote.is_custom && (
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium border border-amber-300">
                        <Sparkles className="w-3 h-3" />
                        <span>自訂</span>
                      </div>
                    </div>
                  )}
                </div>
              </blockquote>
            </div>
          ))}
        </div>

        <div className="px-8 pb-6">
          <div className="border-t border-slate-300 pt-4">
            <p className="text-sm text-slate-500 text-center italic">
              這些語錄代表著你的思維與方向
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
