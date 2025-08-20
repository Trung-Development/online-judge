"use client";

import { useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';
import { getShikiLanguage, getLanguageDisplayName } from '@/lib/highlight';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

interface CodeHighlightProps {
  code: string;
  language: string;
  className?: string;
  showLanguage?: boolean;
  showCopyButton?: boolean;
}

export function CodeHighlight({ 
  code, 
  language, 
  className = '', 
  showLanguage = true, 
  showCopyButton = true 
}: CodeHighlightProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

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
              this.addClassToHast(node, 'text-sm');
              this.addClassToHast(node, 'leading-relaxed');
            }
          }]
        });
        
        setHighlightedCode(html);
      } catch (error) {
        console.error('Failed to highlight code:', error);
        // Fallback to plain pre/code
        setHighlightedCode(`<pre class="overflow-x-auto text-sm leading-relaxed bg-muted p-4 rounded border"><code>${code}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language]);

  if (isLoading) {
    return (
      <div className={`bg-muted rounded-md border ${className}`}>
        {(showLanguage || showCopyButton) && (
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
            {showLanguage && (
              <span className="text-sm font-medium text-muted-foreground">
                {getLanguageDisplayName(language)}
              </span>
            )}
            {showCopyButton && (
              <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
            )}
          </div>
        )}
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-muted rounded-md border overflow-hidden ${className}`}>
      {(showLanguage || showCopyButton) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          {showLanguage && (
            <span className="text-sm font-medium text-muted-foreground">
              {getLanguageDisplayName(language)}
            </span>
          )}
          {showCopyButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
              className="h-8 w-8 p-0"
            >
              <FontAwesomeIcon 
                icon={copied ? faCheck : faCopy} 
                className={`w-3 h-3 ${copied ? 'text-green-600' : ''}`}
              />
            </Button>
          )}
        </div>
      )}
      <div 
        className="p-4"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
}
