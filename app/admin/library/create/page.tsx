'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoverImageUpload } from '@/components/cover-image-upload';
import { ArrowLeft, Loader2, Save, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FamousPerson {
  id: number;
  name: string;
  category: string | null;
  is_published: boolean;
}

interface SelectedPerson {
  personId: number;
  recommendationNote: string;
}

export default function CreateBookPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [famousPeople, setFamousPeople] = useState<FamousPerson[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<SelectedPerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.push('/');
    } else if (profile?.is_admin) {
      fetchFamousPeople();
    }
  }, [profile, router]);

  const fetchFamousPeople = async () => {
    setLoadingPeople(true);
    const { data, error } = await supabase
      .from('famous_people')
      .select('id, name, category, is_published')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching famous people:', error);
    } else {
      setFamousPeople(data || []);
    }
    setLoadingPeople(false);
  };

  const togglePersonSelection = (personId: number) => {
    setSelectedPeople((prev) => {
      const isSelected = prev.some((p) => p.personId === personId);
      if (isSelected) {
        return prev.filter((p) => p.personId !== personId);
      } else {
        return [...prev, { personId, recommendationNote: '' }];
      }
    });
  };

  const updateRecommendationNote = (personId: number, note: string) => {
    setSelectedPeople((prev) =>
      prev.map((p) =>
        p.personId === personId ? { ...p, recommendationNote: note } : p
      )
    );
  };

  const isPersonSelected = (personId: number) => {
    return selectedPeople.some((p) => p.personId === personId);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile.is_admin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !author.trim()) {
      toast({
        title: '必填欄位',
        description: '請填寫書名和作者',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('books')
        .insert({
          title: title.trim(),
          author: author.trim(),
          description: description.trim() || null,
          isbn: isbn.trim() || null,
          cover_image_url: coverImageUrl || null,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (selectedPeople.length > 0) {
        const associations = selectedPeople.map((person) => ({
          famous_person_id: person.personId,
          book_id: data.id,
          recommendation_note: person.recommendationNote.trim() || null,
          added_by: user!.id,
        }));

        const { error: associationError } = await supabase
          .from('famous_people_books')
          .insert(associations);

        if (associationError) {
          console.error('Error creating associations:', associationError);
          toast({
            title: '部分新增失敗',
            description: '書籍已新增，但無法加入部分名人書單',
            variant: 'destructive',
          });
        }
      }

      const successMessage = selectedPeople.length > 0
        ? `書籍已成功新增並加入 ${selectedPeople.length} 個名人書單`
        : '書籍已成功新增到圖書館';

      toast({
        title: '新增成功',
        description: successMessage,
      });

      router.push(`/library/${data.id}`);
    } catch (error) {
      console.error('Error creating book:', error);
      toast({
        title: '新增失敗',
        description: '無法新增書籍，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/library">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回圖書館
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">新增書籍</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base">
                  書名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="輸入書名"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="author" className="text-base">
                  作者 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="輸入作者姓名"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base">
                  書籍簡介
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="輸入書籍簡介或大綱"
                  rows={6}
                  className="mt-2 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="isbn" className="text-base">
                  ISBN
                </Label>
                <Input
                  id="isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="輸入 ISBN 編號（選填）"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-base">書籍封面</Label>
                <div className="mt-2">
                  <CoverImageUpload
                    currentImage={coverImageUrl}
                    onImageUploaded={setCoverImageUrl}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <Label className="text-base">名人書單分類（選填）</Label>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  選擇要將此書加入哪些名人的推薦書單中
                </p>

                {loadingPeople ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : famousPeople.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">目前沒有名人書單</p>
                    <Link href="/admin/famous-people/create">
                      <Button variant="link" className="text-amber-600 mt-2">
                        建立第一個名人書單
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gradient-to-br from-amber-50/30 to-orange-50/30">
                    {famousPeople.map((person) => {
                      const selected = isPersonSelected(person.id);
                      const selectedPerson = selectedPeople.find(
                        (p) => p.personId === person.id
                      );

                      return (
                        <div
                          key={person.id}
                          className="space-y-3 p-4 border rounded-lg bg-white hover:bg-amber-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`person-${person.id}`}
                              checked={selected}
                              onCheckedChange={() => togglePersonSelection(person.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`person-${person.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <span className="font-medium text-gray-900">
                                  {person.name}
                                </span>
                                {person.category && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-800 border-0"
                                  >
                                    {person.category}
                                  </Badge>
                                )}
                                {!person.is_published && (
                                  <Badge variant="outline" className="text-gray-500">
                                    未發佈
                                  </Badge>
                                )}
                              </label>

                              {selected && (
                                <div className="mt-3">
                                  <Label
                                    htmlFor={`note-${person.id}`}
                                    className="text-sm text-gray-600"
                                  >
                                    推薦理由（選填）
                                  </Label>
                                  <Textarea
                                    id={`note-${person.id}`}
                                    value={selectedPerson?.recommendationNote || ''}
                                    onChange={(e) =>
                                      updateRecommendationNote(person.id, e.target.value)
                                    }
                                    placeholder={`為什麼 ${person.name} 推薦這本書？`}
                                    rows={2}
                                    className="mt-1.5 text-sm resize-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedPeople.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                    <p className="text-sm text-amber-900 font-medium">
                      已選擇 {selectedPeople.length} 個名人書單
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !author.trim()}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      新增中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      新增書籍
                    </>
                  )}
                </Button>
                <Link href="/library" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" size="lg">
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
