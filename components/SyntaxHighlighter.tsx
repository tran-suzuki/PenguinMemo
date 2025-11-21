import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface SyntaxHighlighterProps {
    code: string;
    language?: string;
    className?: string;
    fontSize?: number;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
    code,
    language,
    className = '',
    fontSize
}) => {
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current) {
            // Reset content to raw code before highlighting to avoid double-highlighting issues
            codeRef.current.textContent = code;

            if (language && hljs.getLanguage(language)) {
                codeRef.current.className = `hljs language-${language}`;
                hljs.highlightElement(codeRef.current);
            } else {
                codeRef.current.className = 'hljs';
                hljs.highlightElement(codeRef.current);
            }
        }
    }, [code, language]);

    return (
        <pre className={`rounded-md overflow-x-auto ${className}`}>
            <code
                ref={codeRef}
                className="font-mono leading-relaxed bg-transparent"
                style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}
            >
                {code}
            </code>
        </pre>
    );
};
