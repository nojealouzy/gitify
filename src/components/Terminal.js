'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Terminal.module.css';

export default function Terminal({ parser, onCommandExecuted, prompt = '~' }) {
  const [history, setHistory] = useState([
    { type: 'system', text: '@@green@@Welcome to Gitify Terminal@@\nType @@blue@@help@@ for available commands.\n' }
  ]);
  const [input, setInput] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const historyIndexRef = useRef(-1);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Parse colored text with @@color@@text@@ syntax
  const parseColoredText = (text) => {
    if (!text) return '';
    const parts = [];
    let remaining = text;
    let key = 0;

    const regex = /@@(\w+)@@(.*?)@@/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>);
      }
      const color = match[1];
      const content = match[2];
      parts.push(
        <span key={key++} className={styles[`color_${color}`] || ''}>
          {content}
        </span>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      parts.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cmd = input.trim();

    // Add command line to history
    const commandEntry = {
      type: 'command',
      prompt: parser.fs.pwd().replace(/^~/, '~'),
      text: cmd,
    };

    if (!cmd) {
      setHistory(h => [...h, commandEntry]);
      setInput('');
      return;
    }

    const result = parser.execute(cmd);

    if (result.output === '__CLEAR__') {
      setHistory([]);
      setInput('');
      historyIndexRef.current = -1;
      return;
    }

    const newEntries = [commandEntry];

    if (result.error) {
      newEntries.push({ type: 'error', text: result.error });
    } else if (result.output) {
      newEntries.push({
        type: result.type === 'success' ? 'success' : 'output',
        text: result.output,
      });
    }

    setHistory(h => [...h, ...newEntries]);
    setInput('');
    historyIndexRef.current = -1;

    if (onCommandExecuted) {
      onCommandExecuted({ ...result, raw: cmd });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = parser.getPreviousCommand();
      if (prev) setInput(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = parser.getNextCommand();
      setInput(next);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completions = parser.getCompletions(input);
      if (completions.length === 1) {
        setInput(completions[0]);
      } else if (completions.length > 1) {
        setHistory(h => [...h, {
          type: 'output',
          text: completions.join('  '),
        }]);
      }
    }
  };

  const currentPath = parser?.fs?.pwd()?.replace(/^~/, '~') || '~';

  return (
    <div className={`${styles.terminal} scan-line-effect`} onClick={focusInput} ref={terminalRef}>
      {/* Terminal header bar */}
      <div className={styles.terminalHeader}>
        <div className={styles.headerDots}>
          <span className={styles.dot} style={{ background: '#f85149' }}></span>
          <span className={styles.dot} style={{ background: '#d29922' }}></span>
          <span className={styles.dot} style={{ background: '#3fb950' }}></span>
        </div>
        <span className={styles.headerTitle}>gitify — bash</span>
        <div className={styles.headerSpacer}></div>
      </div>

      {/* Terminal body */}
      <div className={styles.terminalBody}>
        {history.map((entry, i) => (
          <div key={i} className={`${styles.line} ${styles[`line_${entry.type}`]}`}>
            {entry.type === 'command' && (
              <span className={styles.promptLine}>
                <span className={styles.promptUser}>student</span>
                <span className={styles.promptAt}>@</span>
                <span className={styles.promptHost}>gitify</span>
                <span className={styles.promptColon}>:</span>
                <span className={styles.promptPath}>{entry.prompt}</span>
                <span className={styles.promptSymbol}>$</span>
                <span className={styles.commandText}>{entry.text}</span>
              </span>
            )}
            {entry.type !== 'command' && (
              <pre className={styles.outputText}>{parseColoredText(entry.text)}</pre>
            )}
          </div>
        ))}

        {/* Active input line */}
        <form onSubmit={handleSubmit} className={styles.inputLine}>
          <span className={styles.promptLine}>
            <span className={styles.promptUser}>student</span>
            <span className={styles.promptAt}>@</span>
            <span className={styles.promptHost}>gitify</span>
            <span className={styles.promptColon}>:</span>
            <span className={styles.promptPath}>{currentPath}</span>
            <span className={styles.promptSymbol}>$</span>
          </span>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.input}
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
            <span
              className={styles.cursor}
              style={{ opacity: cursorVisible ? 1 : 0, left: `${input.length * 0.602}em` }}
            ></span>
          </div>
        </form>
      </div>
    </div>
  );
}
