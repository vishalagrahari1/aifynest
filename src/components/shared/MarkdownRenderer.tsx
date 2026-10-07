/* src/components/shared/MarkdownRenderer.tsx */
import React, { useState } from 'react';
import { Check, Copy } from './Icons';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let currentTable: string[] = [];
  let currentList: string[] = [];
  let currentListType: 'ul' | 'ol' = 'ul';
  let currentQuote: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let currentCodeLines: string[] = [];
  let blockKey = 0;

  const flushTable = () => {
    if (currentTable.length === 0) return;
    const tableLines = [...currentTable];
    currentTable = [];

    const validRows = tableLines.filter((line) => !line.match(/^\|[\s:-|-]+\|$/));
    if (validRows.length === 0) return;

    const parseRow = (rowStr: string) =>
      rowStr
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => (idx > 0 && idx < arr.length - 1) || (arr.length <= 2 && cell !== ''));

    const headerCells = parseRow(validRows[0]);
    const bodyRows = validRows.slice(1).map(parseRow);

    blocks.push(
      <div key={`table-${blockKey++}`} style={{ overflowX: 'auto', margin: '24px 0' }}>
        <table
          className="data-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {headerCells.length > 0 && (
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                {headerCells.map((cell, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rIdx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushList = () => {
    if (currentList.length === 0) return;
    const items = [...currentList];
    const isOl = currentListType === 'ol';
    currentList = [];

    const ListTag = isOl ? 'ol' : 'ul';

    blocks.push(
      <ListTag
        key={`list-${blockKey++}`}
        style={{
          margin: '16px 0 24px 24px',
          padding: 0,
          color: 'var(--text-primary)',
          fontSize: '16px',
          lineHeight: '1.8',
        }}
      >
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '8px' }}>
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  const flushQuote = () => {
    if (currentQuote.length === 0) return;
    const rawQuote = currentQuote.join('\n');
    currentQuote = [];

    let alertType: 'note' | 'tip' | 'warning' | 'important' | null = null;
    let cleanText = rawQuote;

    if (rawQuote.startsWith('[!NOTE]') || rawQuote.startsWith('[!note]')) {
      alertType = 'note';
      cleanText = rawQuote.replace(/^\[!(NOTE|note)\]\s*/, '');
    } else if (rawQuote.startsWith('[!TIP]') || rawQuote.startsWith('[!tip]')) {
      alertType = 'tip';
      cleanText = rawQuote.replace(/^\[!(TIP|tip)\]\s*/, '');
    } else if (rawQuote.startsWith('[!WARNING]') || rawQuote.startsWith('[!warning]')) {
      alertType = 'warning';
      cleanText = rawQuote.replace(/^\[!(WARNING|warning)\]\s*/, '');
    } else if (rawQuote.startsWith('[!IMPORTANT]') || rawQuote.startsWith('[!important]')) {
      alertType = 'important';
      cleanText = rawQuote.replace(/^\[!(IMPORTANT|important)\]\s*/, '');
    }

    const alertStyles = {
      note: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: 'ℹ️ Note' },
      tip: { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '💡 Tip' },
      warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '⚠️ Warning' },
      important: { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8', icon: '⚡ Important' },
    };

    if (alertType) {
      const style = alertStyles[alertType];
      blocks.push(
        <div
          key={`alert-${blockKey++}`}
          style={{
            margin: '24px 0',
            padding: '16px 20px',
            backgroundColor: style.bg,
            borderLeft: `4px solid ${style.border}`,
            borderRadius: '6px',
            color: style.text,
            fontSize: '15px',
            lineHeight: '1.7',
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{style.icon}</span>
          </div>
          <div>{renderInline(cleanText)}</div>
        </div>
      );
    } else {
      blocks.push(
        <blockquote
          key={`quote-${blockKey++}`}
          style={{
            margin: '24px 0',
            padding: '16px 24px',
            backgroundColor: 'var(--color-primary-light)',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            color: 'var(--text-primary)',
            fontSize: '16px',
            fontStyle: 'italic',
            lineHeight: '1.7',
          }}
        >
          {renderInline(cleanText)}
        </blockquote>
      );
    }
  };

  const flushCodeBlock = () => {
    if (currentCodeLines.length === 0 && !inCodeBlock) return;
    const codeString = currentCodeLines.join('\n');
    const lang = codeBlockLang || 'text';
    currentCodeLines = [];
    codeBlockLang = '';
    inCodeBlock = false;

    blocks.push(
      <CodeBlockSnippet key={`code-${blockKey++}`} code={codeString} language={lang} />
    );
  };

  const flushAll = () => {
    flushTable();
    flushList();
    flushQuote();
    flushCodeBlock();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block toggle ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushAll();
        inCodeBlock = true;
        codeBlockLang = trimmed.replace(/^```/, '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeLines.push(line);
      continue;
    }

    // Image detection ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushAll();
      const altText = imgMatch[1];
      const imgSrc = imgMatch[2];
      blocks.push(
        <figure key={`img-${blockKey++}`} style={{ margin: '28px 0', textAlign: 'center' }}>
          <img
            src={imgSrc}
            alt={altText}
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '520px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              display: 'block',
              margin: '0 auto',
              objectFit: 'contain'
            }}
          />
          {altText && (
            <figcaption style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
              {altText}
            </figcaption>
          )}
        </figure>
      );
      continue;
    }

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushQuote();
      currentTable.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    // Blockquote detection
    if (trimmed.startsWith('>')) {
      flushList();
      currentQuote.push(trimmed.replace(/^>\s*/, ''));
      continue;
    } else {
      flushQuote();
    }

    // List item detection
    const ulMatch = trimmed.match(/^[*|-]\s+(.*)/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);

    if (ulMatch) {
      if (currentListType !== 'ul') flushList();
      currentListType = 'ul';
      currentList.push(ulMatch[1]);
      continue;
    } else if (olMatch) {
      if (currentListType !== 'ol') flushList();
      currentListType = 'ol';
      currentList.push(olMatch[2]);
      continue;
    } else {
      flushList();
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushAll();
      blocks.push(
        <hr key={`hr-${blockKey++}`} style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '36px 0' }} />
      );
      continue;
    }

    // Empty line
    if (!trimmed) {
      flushAll();
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      flushAll();
      const rawText = trimmed.replace(/^#\s+/, '');
      const slug = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      blocks.push(
        <h1 id={slug} key={`h1-${blockKey++}`} style={{ fontSize: '2.1rem', fontWeight: 800, margin: '36px 0 18px 0', color: 'var(--text-primary)', lineHeight: '1.25' }}>
          {renderInline(rawText)}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushAll();
      const rawText = trimmed.replace(/^##\s+/, '');
      const slug = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      blocks.push(
        <h2 id={slug} key={`h2-${blockKey++}`} style={{ fontSize: '1.55rem', fontWeight: 700, margin: '32px 0 16px 0', color: 'var(--text-primary)', lineHeight: '1.3', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          {renderInline(rawText)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushAll();
      const rawText = trimmed.replace(/^###\s+/, '');
      const slug = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      blocks.push(
        <h3 id={slug} key={`h3-${blockKey++}`} style={{ fontSize: '1.25rem', fontWeight: 700, margin: '26px 0 12px 0', color: 'var(--text-primary)', lineHeight: '1.35' }}>
          {renderInline(rawText)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      flushAll();
      const rawText = trimmed.replace(/^####\s+/, '');
      const slug = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      blocks.push(
        <h4 id={slug} key={`h4-${blockKey++}`} style={{ fontSize: '1.1rem', fontWeight: 600, margin: '20px 0 10px 0', color: 'var(--text-primary)' }}>
          {renderInline(rawText)}
        </h4>
      );
      continue;
    }

    // Regular Paragraph
    blocks.push(
      <p key={`p-${blockKey++}`} style={{ fontSize: '17px', color: 'var(--text-primary)', lineHeight: '1.8', margin: '0 0 20px 0' }}>
        {renderInline(trimmed)}
      </p>
    );
  }

  flushAll();

  return <div className="markdown-body" style={{ wordBreak: 'break-word' }}>{blocks}</div>;
};

// Component for Fenced Code Block with Copy button
const CodeBlockSnippet: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '24px 0',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #334155',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          fontSize: '12px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          textTransform: 'lowercase',
        }}
      >
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            color: copied ? '#4ade80' : '#cbd5e1',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '16px',
          fontSize: '14px',
          color: '#f8fafc',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          lineHeight: '1.6',
          overflowX: 'auto',
          backgroundColor: '#0f172a',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Render inline markdown elements (**bold**, *italic*, `code`, [links](url))
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Image ![alt](url)
    const imgMatchInline = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatchInline) {
      const altText = imgMatchInline[1];
      const imgSrc = imgMatchInline[2];
      return (
        <span key={idx} style={{ display: 'block', margin: '24px 0', textAlign: 'center' }}>
          <img
            src={imgSrc}
            alt={altText}
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '520px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'block',
              margin: '0 auto',
              objectFit: 'contain'
            }}
          />
        </span>
      );
    }

    // Bold **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    }

    // Italic *text*
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }

    // Inline code `code`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--color-primary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.88em',
            fontFamily: 'monospace',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const url = linkMatch[2];
      const isExternal = url.startsWith('http');
      return (
        <a
          key={idx}
          href={url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}
        >
          {linkText}
        </a>
      );
    }

    return part;
  });
}
