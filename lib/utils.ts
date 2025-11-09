import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';

  const textOnly = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textOnly;
}

export function getPreviewText(content: string, maxLength: number = 150): string {
  const plainText = stripHtmlTags(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

export function calculateWordCount(content: string): number {
  if (!content) return 0;

  const textOnly = stripHtmlTags(content);

  if (!textOnly) return 0;

  const words = textOnly.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
