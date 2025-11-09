'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { BookOpen, User, LogOut, ChevronDown, Plus, MessageSquare, Library, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { POST_CATEGORIES } from '@/lib/supabase';
import { UserTitleBadge } from '@/components/user-title-badge';

export function Navbar() {
  const { user, profile, signOut } = useAuth();

  return (
    <TooltipProvider>
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6 lg:space-x-8">
              <Link href="/" className="flex items-center space-x-2 font-bold text-xl hover:text-blue-600 transition-colors flex-shrink-0">
                <BookOpen className="h-6 w-6" />
                <span>思圈blog</span>
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 font-medium">
                      探索
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[240px]">
                    {POST_CATEGORIES.map((category) => (
                      <DropdownMenuItem key={category} asChild>
                        <Link
                          href={`/explore?category=${encodeURIComponent(category)}`}
                          className="cursor-pointer"
                        >
                          {category}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/explore"
                        className="cursor-pointer underline decoration-2 underline-offset-4"
                      >
                        查看全部
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  href="/library"
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium"
                >
                  <Library className="h-5 w-5" />
                  <span>圖書館</span>
                </Link>

                {user && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/community/1"
                        className="relative text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 px-3 py-1.5 rounded-lg group"
                      >
                        <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">社群</span>
                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>進入社群討論區，與其他成員交流互動</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {user ? (
                <>
                  {profile?.is_admin && (
                    <Link href="/admin/create">
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Plus className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {profile?.user_title && (
                        <div className="px-2 py-2 border-b">
                          <UserTitleBadge title={profile.user_title} size="sm" showTooltip={false} />
                        </div>
                      )}
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/profile/${profile?.username || user.id}${profile?.is_admin ? '?tab=dashboard' : ''}`}
                          className="cursor-pointer"
                        >
                          個人資料
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        登出
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="h-9">登入</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="h-9">註冊</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
