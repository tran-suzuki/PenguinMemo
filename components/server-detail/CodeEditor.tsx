import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    fontSize?: number;
    className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language,
    fontSize = 14,
    className = ''
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && preRef.current && lineNumbersRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const highlightedCode = React.useMemo(() => {
        try {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(value, { language }).value;
            }
            return hljs.highlightAuto(value).value;
        } catch (e) {
            return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
    }, [value, language]);

    // Add an extra newline to the highlighted code to match textarea behavior
    // Textarea allows scrolling past the last line if it ends with newline
    const displayCode = highlightedCode + (value.endsWith('\n') ? '\n' : '');

    const lineCount = value.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className={`relative flex h-full bg-[#0c0c0c] ${className}`}>
            {/* Line Numbers */}
            <div
                ref={lineNumbersRef}
                className="shrink-0 bg-[#0c0c0c] border-r border-slate-800 text-slate-600 font-mono text-right select-none overflow-hidden py-4 pr-3 pl-2"
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.5',
                    minWidth: '3rem'
                }}
            >
                {lineNumbers.map(num => (
                    <div key={num}>{num}</div>
                ))}
            </div>

            {/* Editor Container */}
            <div className="relative flex-1 h-full overflow-hidden">
                {/* Syntax Highlight Layer (Background) */}
                <pre
                    ref={preRef}
                    className="absolute inset-0 m-0 p-4 font-mono text-left whitespace-pre overflow-hidden pointer-events-none"
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: '1.5',
                        fontFamily: 'monospace'
                    }}
                >
                    <code
                        className={`language-${language} bg-transparent p-0 block`}
                        dangerouslySetInnerHTML={{ __html: displayCode }}
                        style={{ fontFamily: 'inherit' }}
                    />
                </pre>

                {/* Textarea Layer (Foreground) */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    className="absolute inset-0 w-full h-full m-0 p-4 font-mono text-transparent bg-transparent caret-white resize-none border-none outline-none whitespace-pre overflow-auto z-10"
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: '1.5',
                        fontFamily: 'monospace'
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                />
            </div>
        </div>
    );
};
