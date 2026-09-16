/* src/components/shared/MarkdownRenderer.tsx */
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content into blocks (paragraphs, headings, lists, tables, blockquotes, hr)
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let currentTable: string[] = [];
  let currentList: string[] = [];
  let currentListType: 'ul' | 'ol' = 'ul';
  let currentQuote: string[] = [];
  let blockKey = 0;

  const flushTable = () => {
    if (currentTable.length === 0) return;
    const tableLines = [...currentTable];
    currentTable = [];

    // Filter out delimiter row (e.g. |---|---|)
    const validRows = tableLines.filter((line) => !line.match(/^\|[\s:-|-]+\|$/));

    if (validRows.length === 0) return;

    const parseRow = (rowStr: string) =>
      rowStr
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length <= 2 && cell !== ''));

    const headerCells = parseRow(validRows[0]);
    const bodyRows = validRows.slice(1).map(parseRow);

    blocks.push(
      <div key={`table-${blockKey++}`} style={{ overflowX: 'auto', margin: '20px 0' }}>
        <table
          className="data-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {headerCells.length > 0 && (
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                {headerCells.map((cell, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
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
          margin: '12px 0 20px 24px',
          padding: 0,
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          lineHeight: '1.7',
        }}
      >
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '6px' }}>
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  const flushQuote = () => {
    if (currentQuote.length === 0) return;
    const quoteText = currentQuote.join(' ');
    currentQuote = [];

    blocks.push(
      <blockquote
        key={`quote-${blockKey++}`}
        style={{
          margin: '20px 0',
          padding: '14px 20px',
          backgroundColor: 'var(--color-primary-light)',
          borderLeft: '4px solid var(--color-primary)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          fontStyle: 'italic',
          lineHeight: '1.6',
        }}
      >
        {renderInline(quoteText)}
      </blockquote>
    );
  };

  const flushAll = () => {
    flushTable();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

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
        <hr key={`hr-${blockKey++}`} style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />
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
      blocks.push(
        <h1 key={`h1-${blockKey++}`} style={{ fontSize: '1.8rem', fontWeight: 800, margin: '32px 0 16px 0', color: 'var(--text-primary)', lineHeight: '1.3' }}>
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushAll();
      blocks.push(
        <h2 key={`h2-${blockKey++}`} style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 14px 0', color: 'var(--text-primary)', lineHeight: '1.35', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushAll();
      blocks.push(
        <h3 key={`h3-${blockKey++}`} style={{ fontSize: '1.15rem', fontWeight: 700, margin: '22px 0 10px 0', color: 'var(--text-primary)', lineHeight: '1.4' }}>
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      flushAll();
      blocks.push(
        <h4 key={`h4-${blockKey++}`} style={{ fontSize: '1rem', fontWeight: 600, margin: '18px 0 8px 0', color: 'var(--text-primary)' }}>
          {renderInline(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
      continue;
    }

    // Regular Paragraph
    blocks.push(
      <p key={`p-${blockKey++}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: '1.75', margin: '0 0 16px 0' }}>
        {renderInline(trimmed)}
      </p>
    );
  }

  flushAll();

  return <div className="markdown-body">{blocks}</div>;
};

/**
 * Render inline markdown elements (**bold**, *italic*, `code`, [links](url))
 */

function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Regex pattern for bold, italic, inline code, and links
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

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
          style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 500 }}
        >
          {linkText}
        </a>
      );
    }

    return part;
  });
}
