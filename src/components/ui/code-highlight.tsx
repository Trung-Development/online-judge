"use client";

import { useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';
import { getShikiLanguage } from '@/lib/highlight';

interface CodeHighlightProps {
  code: string;
  language: string;
  className?: string;
}

export function CodeHighlight({ code, language, className = '' }: CodeHighlightProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        setIsLoading(true);
        const shikiLang = getShikiLanguage(language);
        
        const html = await codeToHtml(code, {
          lang: shikiLang,
          themes: {
            light: 'github-light',
            dark: 'github-dark'
          },
          defaultColor: false,
          transformers: [{
            pre(node) {
              // Add custom classes to the pre element
              this.addClassToHast(node, 'overflow-x-auto');
              this.addClassToHast(node, 'p-4');
              this.addClassToHast(node, 'text-sm');
              this.addClassToHast(node, 'rounded-md');
              this.addClassToHast(node, 'border');
            }
          }]
        });
        
        setHighlightedCode(html);
      } catch (error) {
        console.error('Failed to highlight code:', error);
        // Fallback to plain pre/code
        setHighlightedCode(`<pre class="overflow-x-auto p-4 text-sm rounded-md border bg-muted"><code>${code}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language]);

  if (isLoading) {
    return (
      <div className={`bg-muted rounded-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
}
