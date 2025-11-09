'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionForm } from './subscription-form';
import { BookOpen } from 'lucide-react';

export function SubscriptionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const hasSeenModal = localStorage.getItem('hasSeenSubscriptionModal');

    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('hasSeenSubscriptionModal', 'true');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  const handleSuccess = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Never Miss a Story
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Subscribe to our newsletter and get the latest posts delivered straight to your inbox.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <SubscriptionForm onSuccess={handleSuccess} />
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </DialogContent>
    </Dialog>
  );
}
