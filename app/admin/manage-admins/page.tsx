'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

type AdminUser = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

type AdminAction = {
  id: number;
  performed_by: string;
  target_user_id: string;
  action_type: string;
  created_at: string;
  performer?: {
    username: string | null;
  };
  target?: {
    username: string | null;
  };
};

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile && !profile.is_admin) {
      router.push('/');
      return;
    }

    if (profile) {
      fetchAdmins();
      fetchRecentActions();
    }
  }, [user, profile, router]);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('is_admin', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load admin users',
        variant: 'destructive',
      });
    } else {
      setAdmins(data || []);
    }
    setLoading(false);
  };

  const fetchRecentActions = async () => {
    const { data, error } = await supabase
      .from('admin_actions_log')
      .select(`
        id,
        performed_by,
        target_user_id,
        action_type,
        created_at,
        performer:profiles!admin_actions_log_performed_by_fkey(username),
        target:profiles!admin_actions_log_target_user_id_fkey(username)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      const formattedData = data.map((action: any) => ({
        ...action,
        performer: Array.isArray(action.performer) ? action.performer[0] : action.performer,
        target: Array.isArray(action.target) ? action.target[0] : action.target,
      }));
      setRecentActions(formattedData);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/add-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
        });
        setUsername('');
        setEmail('');
        fetchAdmins();
        fetchRecentActions();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to add admin',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/revoke-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: selectedAdmin.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
        });
        fetchAdmins();
        fetchRecentActions();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to revoke admin privileges',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setRevokeDialogOpen(false);
      setSelectedAdmin(null);
    }
  };

  const openRevokeDialog = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setRevokeDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-slate-900 flex items-center gap-3">
            <Shield className="h-10 w-10 text-blue-600" />
            Admin Management
          </h1>
          <p className="text-slate-600">Grant and manage admin privileges for users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Admin
              </CardTitle>
              <CardDescription>
                Grant admin privileges to an existing user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  The user must already have an account. Enter their username to grant admin privileges.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    disabled={submitting}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Optional: For reference only</p>
                </div>

                <div>
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1.5"
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Required: Must match existing user</p>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={submitting || !username.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding Admin...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add Admin
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Admins ({admins.length})
              </CardTitle>
              <CardDescription>
                Users with admin privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {admins.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No admins found</p>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {admin.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Admin since {formatDistanceToNow(new Date(admin.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {admin.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openRevokeDialog(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest admin privilege changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No recent activity</p>
              ) : (
                recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        action.action_type === 'grant_admin'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {action.action_type === 'grant_admin' ? (
                          <UserPlus className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {action.action_type === 'grant_admin' ? 'Admin privileges granted' : 'Admin privileges revoked'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {action.performer?.username || 'Unknown'} {action.action_type === 'grant_admin' ? 'granted to' : 'revoked from'} {action.target?.username || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Admin Privileges?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke admin privileges from{' '}
              <span className="font-semibold">{selectedAdmin?.username}</span>?
              They will lose access to all admin features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
