const COMMON_WEAK_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'welcome', 'jesus', 'ninja', 'mustang',
  'password1', '123456789', '12345', '1234', 'password123', 'admin', 'root',
  'user', 'test', 'guest', 'demo', 'administrator', '1234567890', 'qwertyuiop',
  'mypass', 'pass', 'pass123', 'temp', 'temporary', 'changeme', 'login',
  'default', 'sample', 'example', '000000', '111111', '222222', '888888',
  '666666', '121212', 'abc12345', 'qwerty123', 'asdfgh', 'zxcvbn', 'azerty',
  'password!', 'p@ssword', 'passw0rd!', '123qwe', 'qwe123', 'asd123', '1q2w3e',
  '1qaz2wsx', 'zaq12wsx', 'access', 'secret', 'secure', 'security', 'pass1234',
  'welcome1', 'welcome123', 'admin123', 'root123', 'user123', 'test123',
  'abcd1234', '1234abcd', 'qwer1234', 'asdf1234', 'password12', 'passw0rd1',
  'letmein1', 'starwars', 'pokemon', 'iloveyou1', 'princess', 'solo', 'cheese',
  'computer', 'maverick', 'whatever', 'jordan', 'sophie', 'freedom', 'love',
  'family', 'andrew', 'liverpool', 'thomas', 'mercedes', 'robert', 'martin',
  'joshua', 'cookie', 'chelsea', 'william', 'george', 'daniel', 'jessica',
];

export interface PasswordValidationResult {
  isValid: boolean;
  score: 0 | 1 | 2 | 3;
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notCommon: boolean;
    notSimilarToEmail: boolean;
  };
}

export interface PasswordStrengthLevel {
  label: string;
  color: string;
  description: string;
}

export function validatePassword(
  password: string,
  email?: string,
  username?: string
): PasswordValidationResult {
  const feedback: string[] = [];
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !isCommonPassword(password),
    notSimilarToEmail: !isSimilarToEmailOrUsername(password, email, username),
  };

  if (!requirements.minLength) {
    feedback.push('密碼長度至少需要 8 個字元');
  }

  if (!requirements.hasUppercase) {
    feedback.push('需要至少一個大寫字母 (A-Z)');
  }

  if (!requirements.hasLowercase) {
    feedback.push('需要至少一個小寫字母 (a-z)');
  }

  if (!requirements.hasNumber) {
    feedback.push('需要至少一個數字 (0-9)');
  }

  if (!requirements.hasSpecialChar) {
    feedback.push('需要至少一個特殊字元 (!@#$%^&* 等)');
  }

  if (!requirements.notCommon) {
    feedback.push('這個密碼太常見了，請選擇更安全的密碼');
  }

  if (!requirements.notSimilarToEmail) {
    feedback.push('密碼不能與您的電子郵件或用戶名相似');
  }

  const score = calculatePasswordScore(requirements, password);
  const isValid = Object.values(requirements).every(Boolean);

  return {
    isValid,
    score,
    feedback,
    requirements,
  };
}

function calculatePasswordScore(
  requirements: PasswordValidationResult['requirements'],
  password: string
): 0 | 1 | 2 | 3 {
  const requirementsMet = Object.values(requirements).filter(Boolean).length;
  const totalRequirements = Object.keys(requirements).length;
  const percentageMet = (requirementsMet / totalRequirements) * 100;

  if (password.length >= 12 && requirementsMet === totalRequirements) {
    return 3;
  } else if (percentageMet >= 85) {
    return 2;
  } else if (percentageMet >= 50) {
    return 1;
  } else {
    return 0;
  }
}

function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_WEAK_PASSWORDS.some(weak => {
    const lowerWeak = weak.toLowerCase();
    return lowerPassword === lowerWeak ||
           lowerPassword.includes(lowerWeak) ||
           lowerWeak.includes(lowerPassword);
  });
}

function isSimilarToEmailOrUsername(
  password: string,
  email?: string,
  username?: string
): boolean {
  if (!email && !username) return false;

  const lowerPassword = password.toLowerCase();

  if (email) {
    const emailParts = email.toLowerCase().split('@');
    const localPart = emailParts[0];
    if (lowerPassword.includes(localPart) || localPart.includes(lowerPassword)) {
      return true;
    }
  }

  if (username) {
    const lowerUsername = username.toLowerCase();
    if (lowerPassword.includes(lowerUsername) || lowerUsername.includes(lowerPassword)) {
      return true;
    }
  }

  return false;
}

export function getPasswordStrength(score: 0 | 1 | 2 | 3): PasswordStrengthLevel {
  const strengths: Record<0 | 1 | 2 | 3, PasswordStrengthLevel> = {
    0: {
      label: '非常弱',
      color: 'bg-red-500',
      description: '這個密碼很容易被破解',
    },
    1: {
      label: '弱',
      color: 'bg-orange-500',
      description: '密碼強度不足，建議改進',
    },
    2: {
      label: '中等',
      color: 'bg-yellow-500',
      description: '密碼強度尚可，可以再加強',
    },
    3: {
      label: '強',
      color: 'bg-green-500',
      description: '這是一個安全的密碼',
    },
  };

  return strengths[score];
}

export function generatePasswordStrengthPercentage(score: 0 | 1 | 2 | 3): number {
  const percentages: Record<0 | 1 | 2 | 3, number> = {
    0: 25,
    1: 50,
    2: 75,
    3: 100,
  };

  return percentages[score];
}
