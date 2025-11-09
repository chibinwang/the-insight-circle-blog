'use client';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const isHtml = (text: string) => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const renderMarkdown = (text: string) => {
    let html = text;

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      return `<img src="${url}" alt="${alt}" class="w-full rounded-lg my-6" />`;
    });

    html = html.replace(/### ([^\n]+)/g, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>');
    html = html.replace(/## ([^\n]+)/g, '<h2 class="text-3xl font-bold mt-10 mb-4">$1</h2>');
    html = html.replace(/# ([^\n]+)/g, '<h1 class="text-4xl font-bold mt-12 mb-6">$1</h1>');

    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/\*([^\*]+)\*/g, '<em class="italic">$1</em>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    html = html.replace(/\n\n+/g, '</p><p class="mb-4">');
    html = html.replace(/\n/g, '<br/>');
    html = '<p class="mb-4">' + html + '</p>';

    html = html.replace(/<p class="mb-4"><\/p>/g, '');

    return html;
  };

  const contentToRender = isHtml(content) ? content : renderMarkdown(content);

  return (
    <div
      className="prose prose-lg max-w-none quill-content"
      dangerouslySetInnerHTML={{ __html: contentToRender }}
    />
  );
}
