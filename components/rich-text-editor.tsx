'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded" />
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [
        '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
        '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
        '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
        '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
        '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
      ] }, { 'background': [
        '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
        '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
        '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
        '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
        '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
      ] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video', 'formula'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'script', 'indent', 'direction',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video', 'formula'
  ];

  if (!mounted) {
    return <div className="h-64 bg-gray-50 animate-pulse rounded" />;
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your story...'}
        className="bg-white"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 500px;
          font-size: 16px;
        }

        .rich-text-editor .ql-editor {
          min-height: 500px;
          line-height: 1.8;
        }

        .rich-text-editor .ql-toolbar {
          background: linear-gradient(to bottom, #ffffff, #f8f9fa);
          border-radius: 8px 8px 0 0;
          border: 1px solid #e2e8f0;
          padding: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .rich-text-editor .ql-toolbar .ql-formats {
          margin-right: 12px;
          padding: 4px;
          border-right: 1px solid #e2e8f0;
        }

        .rich-text-editor .ql-toolbar .ql-formats:last-child {
          border-right: none;
        }

        .rich-text-editor .ql-container {
          border-radius: 0 0 8px 8px;
          border: 1px solid #e2e8f0;
          border-top: none;
          background: white;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          font-size: 16px;
        }

        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #4b5563;
          transition: stroke 0.2s;
        }

        .rich-text-editor .ql-snow .ql-fill {
          fill: #4b5563;
          transition: fill 0.2s;
        }

        .rich-text-editor .ql-snow .ql-picker-label {
          color: #4b5563;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 4px 8px;
          transition: all 0.2s;
        }

        .rich-text-editor .ql-snow .ql-picker-label:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .rich-text-editor .ql-toolbar button {
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 4px;
          transition: all 0.2s;
        }

        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus,
        .rich-text-editor .ql-toolbar button.ql-active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb;
        }

        .rich-text-editor .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .rich-text-editor .ql-snow .ql-picker-options {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 4px;
        }

        .rich-text-editor .ql-snow .ql-picker-item:hover {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .rich-text-editor .ql-editor h1 {
          font-size: 2.5em;
          font-weight: bold;
          margin: 0.67em 0;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.75em 0;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.75em;
          font-weight: bold;
          margin: 0.83em 0;
        }

        .rich-text-editor .ql-editor h4 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0;
        }

        .rich-text-editor .ql-editor h5 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1.17em 0;
        }

        .rich-text-editor .ql-editor h6 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.33em 0;
        }

        .rich-text-editor .ql-snow .ql-color-picker .ql-picker-options {
          width: 252px;
        }

        .rich-text-editor .ql-snow .ql-color-picker .ql-picker-item {
          border: 1px solid #e2e8f0;
          width: 28px;
          height: 28px;
        }

        .ql-size-10px { font-size: 10px; }
        .ql-size-12px { font-size: 12px; }
        .ql-size-14px { font-size: 14px; }
        .ql-size-16px { font-size: 16px; }
        .ql-size-18px { font-size: 18px; }
        .ql-size-20px { font-size: 20px; }
        .ql-size-24px { font-size: 24px; }
        .ql-size-28px { font-size: 28px; }
        .ql-size-32px { font-size: 32px; }
        .ql-size-36px { font-size: 36px; }
        .ql-size-48px { font-size: 48px; }
        .ql-size-64px { font-size: 64px; }
      `}</style>
    </div>
  );
}
