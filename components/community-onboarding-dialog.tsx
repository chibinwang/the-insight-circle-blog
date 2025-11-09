'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield, Lightbulb, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CommunityOnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
  groupId: number;
  userId: string;
}

export function CommunityOnboardingDialog({
  open,
  onComplete,
  groupId,
  userId,
}: CommunityOnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalSteps = 4;

  async function handleComplete() {
    setIsCompleting(true);

    try {
      const { data, error } = await supabase
        .from('group_members')
        .update({ has_completed_onboarding: true })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error completing onboarding:', error);
        throw error;
      }

      // Verify the update was successful
      if (!data || data.length === 0) {
        console.error('No rows updated when completing onboarding');
        throw new Error('Failed to update onboarding status');
      }

      console.log('Onboarding completed successfully:', data);
      toast.success('歡迎加入社群！');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('完成引導時發生錯誤，請稍後再試');
      setIsCompleting(false);
    }
  }

  function handleNext() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative min-h-[600px] flex flex-col">
          <div className="absolute top-6 right-6 flex gap-1.5">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
                  i + 1 === currentStep
                    ? 'bg-slate-300'
                    : i + 1 < currentStep
                    ? 'bg-slate-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-6 left-6 text-xs font-medium text-slate-400 tracking-wider">
            第 {currentStep} / {totalSteps} 步
          </div>

          <div className="flex-1 flex items-center justify-center p-12 pt-20">
            <div
              key={currentStep}
              className="w-full max-w-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            >
              {currentStep === 1 && <Step1 />}
              {currentStep === 2 && <Step2 />}
              {currentStep === 3 && <Step3 />}
              {currentStep === 4 && <Step4 />}
            </div>
          </div>

          <div className="border-t border-slate-700 p-8 bg-slate-900/50">
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              className="w-full h-14 text-lg font-medium bg-slate-50 text-slate-900 hover:bg-slate-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompleting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
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
                  進入中...
                </>
              ) : currentStep === 1 ? (
                '了解規則'
              ) : currentStep === 2 ? (
                '我理解並同意'
              ) : currentStep === 3 ? (
                '我準備好了'
              ) : (
                '開始對話'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step1() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 border border-slate-700 mb-4">
        <MessageSquare className="w-10 h-10 text-slate-300" />
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          歡迎加入思圈社群
          <br />
          <span className="text-slate-400 text-2xl">The Insight Circle</span>
        </h1>

        <p className="text-lg text-slate-300 leading-relaxed max-w-lg mx-auto">
          這裡是一個讓大家交流、啟發、分享洞見的空間。在開始聊天之前，我們想邀請你了解一下這裡的小規則，確保每個對話都能讓人感到被尊重與自在。
        </p>
      </div>
    </div>
  );
}

function Step2() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 border border-slate-700 mb-4">
          <Shield className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">社群原則</h2>
      </div>

      <div className="space-y-6 bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        <div className="space-y-2">
          <p className="text-lg text-slate-200 leading-relaxed">
            <span className="inline-block w-8 text-slate-400 font-semibold">1️⃣</span>
            對每個人保持尊重，不詆毀、不做人身攻擊。
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-lg text-slate-200 leading-relaxed">
            <span className="inline-block w-8 text-slate-400 font-semibold">2️⃣</span>
            你的發言代表你自己，請為自己的文字負責。
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-lg text-slate-200 leading-relaxed">
            <span className="inline-block w-8 text-slate-400 font-semibold">3️⃣</span>
            若出現違反社群規則的情況，管理者有權請你暫時離開。
          </p>
        </div>
      </div>

      <p className="text-center text-slate-400 italic text-sm">
        「這不只是規範，而是為了讓對話更有價值。」
      </p>
    </div>
  );
}

function Step3() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 border border-slate-700 mb-4">
          <Lightbulb className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">讓對話更有深度</h2>
      </div>

      <div className="space-y-6 bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        <p className="text-lg text-slate-200 leading-relaxed">
          在這裡，我們鼓勵探討，而不是爭論。
        </p>

        <p className="text-lg text-slate-200 leading-relaxed">
          每個人都能帶著不同觀點進來，最重要的是——願意傾聽，也願意思考。
        </p>

        <p className="text-lg text-slate-200 leading-relaxed">
          放下成見、打開思路，這樣你會發現，對話的價值比答案更重要。
        </p>
      </div>
    </div>
  );
}

function Step4() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 border border-slate-700 mb-4">
        <Sparkles className="w-10 h-10 text-slate-300" />
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">歡迎加入對話</h2>

        <div className="space-y-4 max-w-lg mx-auto">
          <p className="text-xl text-slate-300 leading-relaxed">
            你的觀點，可能正是別人突破的起點。
          </p>

          <p className="text-lg text-slate-400 leading-relaxed">
            請開始你的第一則訊息吧。
          </p>
        </div>
      </div>
    </div>
  );
}
