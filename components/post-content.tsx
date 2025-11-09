'use client';

import 'react-quill/dist/quill.snow.css';

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div
      className="prose prose-lg max-w-none text-gray-800 leading-relaxed ql-editor"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        padding: '0',
        minHeight: 'auto',
        fontSize: '16px',
        lineHeight: '1.8'
      }}
    />
  );
}
