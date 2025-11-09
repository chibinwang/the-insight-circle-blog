'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Quote, Plus, Trash2, Sparkles } from 'lucide-react';

interface QuoteData {
  id: number;
  text_chinese: string | null;
  text_english: string | null;
  language: string;
  display_order: number;
  is_custom?: boolean;
  created_by_user_id?: string | null;
}

interface QuoteSelectionDialogProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

export function QuoteSelectionDialog({
  open,
  onComplete,
  userId,
}: QuoteSelectionDialogProps) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customQuoteText, setCustomQuoteText] = useState('');
  const [customQuoteLanguage, setCustomQuoteLanguage] = useState<'chinese' | 'english'>('chinese');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  useEffect(() => {
    if (open) {
      loadQuotes();
    }
  }, [open]);

  async function loadQuotes() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setQuotes(data || []);

      await loadUserSelectedQuotes();
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('載入語錄時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserSelectedQuotes() {
    try {
      const { data, error } = await supabase
        .from('user_selected_quotes')
        .select('quote_id')
        .eq('user_id', userId);

      if (error) throw error;

      const selected = new Set(data?.map(item => item.quote_id) || []);
      setSelectedQuotes(selected);
    } catch (error) {
      console.error('Error loading user selected quotes:', error);
    }
  }

  async function handleCreateCustomQuote() {
    const trimmedText = customQuoteText.trim();

    if (!trimmedText) {
      toast.error('請輸入語錄內容');
      return;
    }

    if (trimmedText.length < 10) {
      toast.error('語錄至少需要 10 個字元');
      return;
    }

    if (trimmedText.length > 200) {
      toast.error('語錄不能超過 200 個字元');
      return;
    }

    setIsCreatingCustom(true);

    try {
      const quoteData = {
        text_chinese: customQuoteLanguage === 'chinese' ? trimmedText : null,
        text_english: customQuoteLanguage === 'english' ? trimmedText : null,
        language: customQuoteLanguage,
        display_order: 999,
        is_custom: true,
        created_by_user_id: userId,
        is_visible: true,
      };

      const { data, error } = await supabase
        .from('quotes')
        .insert([quoteData])
        .select()
        .single();

      if (error) throw error;

      setQuotes([...quotes, data]);

      const newSelected = new Set(selectedQuotes);
      newSelected.add(data.id);
      setSelectedQuotes(newSelected);

      setCustomQuoteText('');
      toast.success('自訂語錄已建立並選擇！');
    } catch (error) {
      console.error('Error creating custom quote:', error);
      toast.error('建立自訂語錄時發生錯誤');
    } finally {
      setIsCreatingCustom(false);
    }
  }

  async function handleDeleteCustomQuote(quoteId: number) {
    if (!confirm('確定要刪除這句自訂語錄嗎？')) {
      return;
    }

    try {
      const { error: deleteSelectedError } = await supabase
        .from('user_selected_quotes')
        .delete()
        .eq('quote_id', quoteId)
        .eq('user_id', userId);

      if (deleteSelectedError) throw deleteSelectedError;

      const { error: deleteQuoteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
        .eq('created_by_user_id', userId);

      if (deleteQuoteError) throw deleteQuoteError;

      setQuotes(quotes.filter(q => q.id !== quoteId));

      const newSelected = new Set(selectedQuotes);
      newSelected.delete(quoteId);
      setSelectedQuotes(newSelected);

      toast.success('自訂語錄已刪除');
    } catch (error) {
      console.error('Error deleting custom quote:', error);
      toast.error('刪除自訂語錄時發生錯誤');
    }
  }

  function toggleQuote(quoteId: number) {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotes(newSelected);
  }

  async function handleConfirm() {
    if (selectedQuotes.size === 0) {
      toast.error('請至少選擇一句語錄');
      return;
    }

    if (selectedQuotes.size > 5) {
      toast.error('最多只能選擇 5 句語錄');
      return;
    }

    setIsSaving(true);

    try {
      const { data: existingSelections, error: fetchError } = await supabase
        .from('user_selected_quotes')
        .select('quote_id')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      const existingQuoteIds = new Set(existingSelections?.map(s => s.quote_id) || []);
      const currentQuoteIds = selectedQuotes;

      const toAdd = Array.from(currentQuoteIds).filter(id => !existingQuoteIds.has(id));
      const toRemove = Array.from(existingQuoteIds).filter(id => !currentQuoteIds.has(id));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_selected_quotes')
          .delete()
          .eq('user_id', userId)
          .in('quote_id', toRemove);

        if (deleteError) throw deleteError;
      }

      if (toAdd.length > 0) {
        const insertData = toAdd.map((quoteId) => ({
          user_id: userId,
          quote_id: quoteId,
        }));

        const { error: insertError } = await supabase
          .from('user_selected_quotes')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('語錄已儲存！');
      onComplete();
    } catch (error) {
      console.error('Error saving quotes:', error);
      toast.error('儲存語錄時發生錯誤');
      setIsSaving(false);
    }
  }

  const chineseQuotes = quotes.filter((q) => q.language === 'chinese' && !q.is_custom);
  const englishQuotes = quotes.filter((q) => q.language === 'english' && !q.is_custom);
  const customQuotes = quotes.filter((q) => q.is_custom);

  if (isSaving) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-2xl border-0 bg-gradient-to-br from-slate-50 to-slate-100 p-0 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="relative min-h-[500px] flex flex-col items-center justify-center p-12">
            <div className="text-center space-y-8 animate-in fade-in-0 duration-700">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-200 mb-4">
                <svg
                  className="animate-spin h-10 w-10 text-slate-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  儲存並顯示：
                </h2>
                <div className="max-w-lg mx-auto space-y-4">
                  <p className="text-xl text-slate-700 leading-relaxed font-serif">
                    你的思維代表你的方向。
                  </p>
                  <p className="text-lg text-slate-600 leading-relaxed font-serif">
                    讓我們從這裡開始，打造屬於你的 Insight Journey
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] border-0 bg-white p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-8">
            <div className="flex items-center gap-3 mb-3">
              <Quote className="w-8 h-8" />
              <h2 className="text-3xl font-bold">選擇你的座右銘</h2>
            </div>
            <p className="text-slate-200 text-lg">
              選擇最能代表你的語錄，它們將成為你的思維指引
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-12">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="inline-block w-1 h-6 bg-slate-800"></span>
                    中文語錄
                  </h3>
                  <div className="grid gap-4">
                    {chineseQuotes.map((quote) => (
                      <button
                        key={quote.id}
                        onClick={() => toggleQuote(quote.id)}
                        className={`group relative text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                          selectedQuotes.has(quote.id)
                            ? 'border-slate-700 bg-slate-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              selectedQuotes.has(quote.id)
                                ? 'border-slate-700 bg-slate-700'
                                : 'border-slate-300 group-hover:border-slate-500'
                            }`}
                          >
                            {selectedQuotes.has(quote.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-lg leading-relaxed text-slate-700 font-serif flex-1">
                            「{quote.text_chinese}」
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="inline-block w-1 h-6 bg-slate-800"></span>
                    English Quotes
                  </h3>
                  <div className="grid gap-4">
                    {englishQuotes.map((quote) => (
                      <button
                        key={quote.id}
                        onClick={() => toggleQuote(quote.id)}
                        className={`group relative text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                          selectedQuotes.has(quote.id)
                            ? 'border-slate-700 bg-slate-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              selectedQuotes.has(quote.id)
                                ? 'border-slate-700 bg-slate-700'
                                : 'border-slate-300 group-hover:border-slate-500'
                            }`}
                          >
                            {selectedQuotes.has(quote.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-lg leading-relaxed text-slate-700 font-serif italic flex-1">
                            "{quote.text_english}"
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {customQuotes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="inline-block w-1 h-6 bg-slate-800"></span>
                      我的自訂語錄
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </h3>
                    <div className="grid gap-4">
                      {customQuotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                            selectedQuotes.has(quote.id)
                              ? 'border-amber-500 bg-amber-50 shadow-md'
                              : 'border-amber-200 bg-white hover:border-amber-400 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleQuote(quote.id)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    selectedQuotes.has(quote.id)
                                      ? 'border-amber-600 bg-amber-600'
                                      : 'border-amber-300 group-hover:border-amber-500'
                                  }`}
                                >
                                  {selectedQuotes.has(quote.id) && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <p className={`text-lg leading-relaxed text-slate-700 font-serif flex-1 ${
                                  quote.language === 'english' ? 'italic' : ''
                                }`}>
                                  {quote.language === 'chinese' ? `「${quote.text_chinese}」` : `"${quote.text_english}"`}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={() => handleDeleteCustomQuote(quote.id)}
                              className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="刪除自訂語錄"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t-4 border-slate-200 pt-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Plus className="w-6 h-6 text-green-600" />
                    建立自訂語錄
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customQuoteText" className="text-sm font-medium text-slate-700 mb-2 block">
                          語錄內容 (10-200 字元)
                        </Label>
                        <Textarea
                          id="customQuoteText"
                          placeholder="輸入你的個人座右銘..."
                          value={customQuoteText}
                          onChange={(e) => setCustomQuoteText(e.target.value)}
                          className="resize-none bg-white"
                          rows={3}
                          maxLength={200}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {customQuoteText.length} / 200 字元
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                          語言
                        </Label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setCustomQuoteLanguage('chinese')}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                              customQuoteLanguage === 'chinese'
                                ? 'border-green-600 bg-green-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-green-400'
                            }`}
                          >
                            中文
                          </button>
                          <button
                            onClick={() => setCustomQuoteLanguage('english')}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                              customQuoteLanguage === 'english'
                                ? 'border-green-600 bg-green-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-green-400'
                            }`}
                          >
                            English
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={handleCreateCustomQuote}
                        disabled={isCreatingCustom || customQuoteText.trim().length < 10}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingCustom ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            建立中...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            建立自訂語錄
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">
                已選擇 {selectedQuotes.size} / 5 句語錄
              </p>
              {selectedQuotes.size > 0 && (
                <button
                  onClick={() => setSelectedQuotes(new Set())}
                  className="text-sm text-slate-600 hover:text-slate-800 underline"
                >
                  清除選擇
                </button>
              )}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={selectedQuotes.size === 0}
              className="w-full h-12 text-lg font-medium bg-slate-800 hover:bg-slate-900 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              確認選擇
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
