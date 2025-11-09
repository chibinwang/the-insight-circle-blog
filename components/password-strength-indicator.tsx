'use client';

import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import {
  validatePassword,
  getPasswordStrength,
  generatePasswordStrengthPercentage,
  type PasswordValidationResult,
} from '@/lib/password-validator';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PasswordStrengthIndicatorProps {
  password: string;
  email?: string;
  username?: string;
  showPasswordToggle?: boolean;
  onPasswordVisibilityChange?: (visible: boolean) => void;
  passwordVisible?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  email,
  username,
  showPasswordToggle = false,
  onPasswordVisibilityChange,
  passwordVisible = false,
}: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password, email, username);
  const strength = getPasswordStrength(validation.score);
  const percentage = generatePasswordStrengthPercentage(validation.score);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium min-w-[60px]">
          {strength.label}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <p className="text-xs text-gray-600 font-medium">密碼要求：</p>

        <div className="space-y-1.5">
          <RequirementItem
            met={validation.requirements.minLength}
            text="至少 8 個字元"
          />
          <RequirementItem
            met={validation.requirements.hasUppercase}
            text="包含大寫字母 (A-Z)"
          />
          <RequirementItem
            met={validation.requirements.hasLowercase}
            text="包含小寫字母 (a-z)"
          />
          <RequirementItem
            met={validation.requirements.hasNumber}
            text="包含數字 (0-9)"
          />
          <RequirementItem
            met={validation.requirements.hasSpecialChar}
            text="包含特殊字元 (!@#$%^&*)"
          />
          <RequirementItem
            met={validation.requirements.notCommon}
            text="不是常見的弱密碼"
          />
          <RequirementItem
            met={validation.requirements.notSimilarToEmail}
            text="不與電子郵件或用戶名相似"
          />
        </div>

        {validation.feedback.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-1">改進建議：</p>
            <ul className="space-y-1">
              {validation.feedback.map((feedback, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{feedback}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.isValid && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              密碼符合所有安全要求
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-700' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}

interface PasswordInputWithToggleProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

export function PasswordInputWithToggle({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete = 'new-password',
  className = '',
}: PasswordInputWithToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4 text-gray-400" />
        ) : (
          <Eye className="h-4 w-4 text-gray-400" />
        )}
      </Button>
    </div>
  );
}
