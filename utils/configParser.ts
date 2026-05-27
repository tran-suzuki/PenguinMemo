import { STANDARD_PROMPT_REGEX, CONTEXT_LINE_REGEX, COMMAND_LINE_REGEX } from './promptPatterns';

export interface ParsedConfig {
    id: string;
    path: string;
    content: string;
    type: string;
}

export const detectType = (path: string): string => {
    const lowerPath = path.toLowerCase();
    if (lowerPath.includes('nginx')) return 'nginx';
    if (lowerPath.includes('apache') || lowerPath.includes('httpd')) return 'apache';
    if (lowerPath.includes('cron') || lowerPath.endsWith('crontab')) return 'cron';
    if (lowerPath.includes('systemd') || lowerPath.endsWith('.service')) return 'systemd';
    if (lowerPath.includes('docker') || lowerPath.endsWith('Dockerfile')) return 'docker';
    if (lowerPath.endsWith('.yml') || lowerPath.endsWith('.yaml')) return 'yaml';
    if (lowerPath.endsWith('.json')) return 'json';
    if (lowerPath.endsWith('.env')) return 'env';
    if (lowerPath.endsWith('.sh')) return 'shell';
    if (lowerPath.endsWith('.py')) return 'python';
    if (lowerPath.endsWith('.js') || lowerPath.endsWith('.ts')) return 'js';
    if (lowerPath.endsWith('.sql')) return 'sql';
    if (lowerPath.includes('ssh_config') || lowerPath.includes('sshd_config')) return 'ssh';
    return 'other';
};

export const parseConfigsFromOutput = (rawInput: string): ParsedConfig[] => {
    if (!rawInput.trim()) return [];

    // 改行コードを正規化してから分割する。
    // Windowsのクリップボード(CRLF)を貼り付けると各行末に \r が残り、
    // プロンプト検出正規表現の (.*)$ が \r の手前でマッチできず
    // pwd/cat 行を検出できなくなる（0件になる）ため。
    const lines = rawInput.split(/\r\n|\r|\n/);
    const configs: ParsedConfig[] = [];

    let currentDir = '';
    let currentFile: string | null = null;
    let currentContent: string[] = [];

    // Regex to detect prompt lines (共通定義: utils/promptPatterns.ts)
    const standardPromptRegex = STANDARD_PROMPT_REGEX;
    const contextLineRegex = CONTEXT_LINE_REGEX;
    const commandLineRegex = COMMAND_LINE_REGEX;

    // State flags
    let expectingPwdOutput = false;

    const saveCurrentFile = () => {
        if (currentFile && currentContent.length > 0) {
            // Resolve path
            let fullPath = currentFile;
            if (!currentFile.startsWith('/') && currentDir) {
                fullPath = `${currentDir.replace(/\/$/, '')}/${currentFile}`;
            }

            configs.push({
                id: Math.random().toString(36).substr(2, 9),
                path: fullPath,
                content: currentContent.join('\n').trim(),
                type: detectType(fullPath)
            });
        }
        currentFile = null;
        currentContent = [];
    };

    lines.forEach((line) => {
        const trimmedLine = line.trim();

        // 1. Check for Standard Prompt
        const standardMatch = line.match(standardPromptRegex);

        // 2. Check for Context Line (Multi-line prompt)
        const contextMatch = line.match(contextLineRegex);

        // 3. Check for Command Line (Multi-line prompt)
        const commandMatch = line.match(commandLineRegex);

        let command = '';

        if (standardMatch) {
            // Standard Prompt detected
            command = standardMatch[3].trim();

            if (currentFile) saveCurrentFile();

            const promptDir = standardMatch[2].trim();
            if (promptDir && promptDir !== '~' && promptDir.startsWith('/')) {
                currentDir = promptDir;
            }

        } else if (contextMatch) {
            // Context line detected, just update dir and wait for next line
            if (currentFile) saveCurrentFile();

            const promptDir = contextMatch[2].trim();
            if (promptDir && promptDir !== '~' && promptDir.startsWith('/')) {
                currentDir = promptDir;
            }
            return; // Skip processing this line further

        } else if (commandMatch) {
            // Command line detected (> command)
            command = commandMatch[1].trim();
            if (currentFile) saveCurrentFile();

        } else {
            // No prompt, check heuristics
            if (trimmedLine === 'pwd') {
                command = 'pwd';
                if (currentFile) saveCurrentFile();
            } else if (trimmedLine.startsWith('cat ')) {
                command = trimmedLine;
                if (currentFile) saveCurrentFile();
            }
        }

        // Process Command or Content
        if (command) {
            // It's a command line
            if (command === 'pwd') {
                expectingPwdOutput = true;
            } else if (command.startsWith('cat ')) {
                expectingPwdOutput = false;
                const args = command.split(/\s+/);
                if (args.length >= 2) {
                    currentFile = args[1];
                }
            } else {
                // Other command, stop reading file
                expectingPwdOutput = false;
                if (currentFile) saveCurrentFile();
            }
        } else {
            // It's output or content
            if (expectingPwdOutput) {
                if (trimmedLine.startsWith('/')) {
                    currentDir = trimmedLine;
                }
                expectingPwdOutput = false;
            } else if (currentFile) {
                currentContent.push(line);
            }
        }
    });

    // Save last file
    if (currentFile) {
        saveCurrentFile();
    }

    return configs;
};
