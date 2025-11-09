'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { FamousPersonCard } from '@/components/famous-person-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Users } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AdminFamousPeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<number | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    if (!profile.is_admin) {
      router.push('/');
      return;
    }
    fetchPeople();
  }, [profile]);

  useEffect(() => {
    filterPeople();
  }, [people, searchTerm]);

  const fetchPeople = async () => {
    setLoading(true);

    const { data: peopleData, error: peopleError } = await supabase
      .from('famous_people')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (peopleError) {
      console.error('Error fetching famous people:', peopleError);
      setLoading(false);
      return;
    }

    const peopleWithCounts = await Promise.all(
      (peopleData || []).map(async (person) => {
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

    setPeople(peopleWithCounts);
    setLoading(false);
  };

  const filterPeople = () => {
    if (!searchTerm.trim()) {
      setFilteredPeople(people);
      return;
    }

    const filtered = people.filter((person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.category && person.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredPeople(filtered);
  };

  const handleDeleteClick = (personId: number) => {
    setPersonToDelete(personId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!personToDelete) return;

    try {
      const { error } = await supabase
        .from('famous_people')
        .delete()
        .eq('id', personToDelete);

      if (error) throw error;

      toast({
        title: '刪除成功',
        description: '名人已成功刪除',
      });

      fetchPeople();
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除名人，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    }
  };

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-10 w-10 text-amber-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">管理名人書單</h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">
            創建和管理名人的精選書單推薦
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜尋名人或類別..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Link href="/admin/famous-people/create">
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                <Plus className="h-4 w-4" />
                新增名人
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm ? '找不到符合的名人' : '目前沒有名人書單'}
            </p>
            {!searchTerm && (
              <Link href="/admin/famous-people/create">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  新增第一位名人
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPeople.map((person) => (
              <FamousPersonCard key={person.id} person={person} onDelete={handleDeleteClick} />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此名人嗎？此操作將同時刪除所有相關的書單推薦，且無法復原。
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
