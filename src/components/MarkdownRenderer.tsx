import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check, Terminal } from 'lucide-react';
import { soundManager } from '../services/soundManager';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  theme?: 'light' | 'dark';
}

/**
 * Safely renders LaTeX string via KaTeX.
 * If KaTeX fails, cleans raw LaTeX markers so students never see raw \frac{}, \text{}, \quad syntax.
 */
function renderMathToHtml(mathStr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(mathStr.trim(), {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (e) {
    // Graceful fallback: clean up raw LaTeX tags so student never sees \text{}, \frac{}, \quad
    return cleanRawLatexText(mathStr);
  }
}

/**
 * Fallback sanitizer that replaces common raw LaTeX syntax with clean Unicode/readable text
 */
function cleanRawLatexText(text: string): string {
  return text
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathbf\{([^}]*)\}/g, '$1')
    .replace(/\\mathit\{([^}]*)\}/g, '$1')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\quad/g, '   ')
    .replace(/\\qquad/g, '      ')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\in/g, '∈')
    .replace(/\\subset/g, '⊂')
    .replace(/\\infty/g, '∞')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\[a-zA-Z]+/g, ''); // strip any remaining unknown slash commands
}

/**
 * Parses inline string with support for:
 * - Math: $...$ or \(...\)
 * - Raw LaTeX sequences like \text{}, \frac{}, etc.
 * - Bold: **...**
 * - Italic: *...*
 * - Inline code: `...`
 */
function parseInlineWithMath(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. Math block/inline: $...$ or \(...\)
  // 2. Bold: **...**
  // 3. Italic: *...*
  // 4. Inline code: `...`
  // 5. Raw LaTeX command fragments that might be unescaped (e.g., \frac{...}{...}, \text{...}, \quad)
  const regex = /(\$(?:\\\$|[^\$])+\$|\\\((?:\\\)|[^\)])+\\\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\\(?:text|frac|sqrt|mathbf|mathit|quad|qquad|times|cdot|approx|leq|geq|neq|sum|int|infty)\b(?:\{[^}]*\})*)/g;

  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Inline math: $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      const mathContent = part.slice(1, -1);
      const html = renderMathToHtml(mathContent, false);
      return (
        <span
          key={`math-${index}`}
          className="inline-math px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // Inline math: \(...\)
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const mathContent = part.slice(2, -2);
      const html = renderMathToHtml(mathContent, false);
      return (
        <span
          key={`math-p-${index}`}
          className="inline-math px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // 2. Bold: **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={`b-${index}`} className="font-bold text-black dark:text-[#F0EDE4]">
          {parseInlineWithMath(part.slice(2, -2))}
        </strong>
      );
    }

    // 3. Italic: *...*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <em key={`i-${index}`} className="italic text-black/90 dark:text-[#F0EDE4]/90">
          {parseInlineWithMath(part.slice(1, -1))}
        </em>
      );
    }

    // 4. Inline code: `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={`c-${index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-black/5 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7] font-mono text-xs font-semibold border border-black/10 dark:border-[#004741]/40"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 5. Unwrapped LaTeX snippet (like \frac{a}{b} or \text{...} or \quad)
    if (part.startsWith('\\') && /\\(?:text|frac|sqrt|mathbf|quad|times|cdot|approx|leq|geq|neq)/.test(part)) {
      const html = renderMathToHtml(part, false);
      return (
        <span
          key={`raw-latex-${index}`}
          className="inline-math px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // Plain text: double check if there are lingering raw LaTeX artifacts
    if (part.includes('\\frac') || part.includes('\\text') || part.includes('\\quad') || part.includes('$$')) {
      const cleaned = cleanRawLatexText(part);
      return <span key={`clean-${index}`}>{cleaned}</span>;
    }

    return <span key={`t-${index}`}>{part}</span>;
  });
}

/**
 * Code Block with syntax tag and copy button
 */
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    soundManager.play('button_click');
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-black/20 dark:border-white/15 bg-black shadow-sm text-[#F0EDE4]">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/10 border-b border-white/10 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-white/70">
          <Terminal className="w-3.5 h-3.5 text-[#6ee7b7]" />
          <span className="uppercase text-[11px] font-bold tracking-wider">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#F0EDE4]/80 hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#6ee7b7]" />
              <span className="text-[#6ee7b7]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-[#F0EDE4] selection:bg-[#004741] selection:text-white">
        <pre>{code}</pre>
      </div>
    </div>
  );
};

/**
 * Table Component for Markdown tables
 */
const TableBlock: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => {
  return (
    <div className="my-3 overflow-x-auto rounded-2xl border border-black/15 dark:border-white/15 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#004741] text-[#F0EDE4]">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3.5 py-2.5 font-bold uppercase tracking-wider border-b border-black/20"
              >
                {parseInlineWithMath(h.trim())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/10 bg-white/80 dark:bg-[#0c1412]">
          {rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5'}
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className="px-3.5 py-2 text-black/90 dark:text-[#F0EDE4]/90 border-r last:border-r-0 border-black/5 dark:border-white/5"
                >
                  {parseInlineWithMath(cell.trim())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Split content into lines
  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer: string[] = [];

  let inBlockMath = false;
  let mathBuffer: string[] = [];

  let tableHeader: string[] | null = null;
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (tableHeader && tableRows.length > 0) {
      elements.push(
        <TableBlock key={key} headers={tableHeader} rows={tableRows} />
      );
      tableHeader = null;
      tableRows = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Code Block Handling
    if (trimmed.startsWith('```')) {
      flushTable(`table-before-code-${i}`);

      if (inCodeBlock) {
        // Closing code block
        elements.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeBuffer.join('\n')}
            language={codeLanguage}
          />
        );
        codeBuffer = [];
        codeLanguage = '';
        inCodeBlock = false;
      } else {
        // Opening code block
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Block Math: $$ ... $$ or \[ ... \]
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      flushTable(`table-before-math-${i}`);
      const mathCode = trimmed.slice(2, -2).trim();
      const html = renderMathToHtml(mathCode, true);
      elements.push(
        <div
          key={`math-block-${i}`}
          className="my-3.5 p-3 rounded-2xl bg-[#004741]/5 dark:bg-[#004741]/15 border border-[#004741]/20 overflow-x-auto text-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
      continue;
    }

    if (trimmed === '$$' || trimmed === '\\[') {
      flushTable(`table-before-math-multi-${i}`);
      if (inBlockMath) {
        // Closing
        const mathCode = mathBuffer.join('\n');
        const html = renderMathToHtml(mathCode, true);
        elements.push(
          <div
            key={`math-block-multi-${i}`}
            className="my-3.5 p-3 rounded-2xl bg-[#004741]/5 dark:bg-[#004741]/15 border border-[#004741]/20 overflow-x-auto text-center"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        mathBuffer = [];
        inBlockMath = false;
      } else {
        inBlockMath = true;
      }
      continue;
    }

    if (inBlockMath) {
      if (trimmed === '$$' || trimmed === '\\]') {
        const mathCode = mathBuffer.join('\n');
        const html = renderMathToHtml(mathCode, true);
        elements.push(
          <div
            key={`math-block-multi-${i}`}
            className="my-3.5 p-3 rounded-2xl bg-[#004741]/5 dark:bg-[#004741]/15 border border-[#004741]/20 overflow-x-auto text-center"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        mathBuffer = [];
        inBlockMath = false;
      } else {
        mathBuffer.push(line);
      }
      continue;
    }

    // 3. Markdown Table Handling
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if it's the divider row: |:---|:---| or |---|---|
      const isDivider = cells.every((c) => /^:?-+:?$/.test(c));

      if (isDivider) {
        // Just the divider, continue
        continue;
      }

      if (!tableHeader) {
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      // Non-table line encountered, flush any active table
      flushTable(`table-flush-${i}`);
    }

    // 4. Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-4 border-t border-black/10 dark:border-white/10"
        />
      );
      continue;
    }

    // 5. Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl sm:text-2xl font-black text-black dark:text-[#F0EDE4] mt-5 mb-2 tracking-tight"
        >
          {parseInlineWithMath(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg sm:text-xl font-bold text-[#004741] dark:text-[#6ee7b7] mt-4 mb-2 tracking-tight flex items-center gap-2"
        >
          <span className="w-1.5 h-4 rounded-full bg-[#004741] dark:bg-[#6ee7b7] inline-block" />
          <span>{parseInlineWithMath(line.slice(3))}</span>
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-bold text-[#004741] dark:text-[#6ee7b7] mt-3.5 mb-1.5 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-3 rounded-full bg-[#004741] dark:bg-[#6ee7b7] inline-block" />
          <span>{parseInlineWithMath(line.slice(4))}</span>
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-sm font-bold text-black dark:text-[#F0EDE4] mt-3 mb-1 uppercase tracking-wider"
        >
          {parseInlineWithMath(line.slice(5))}
        </h4>
      );
      continue;
    }

    // 6. Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-4 border-[#004741] bg-[#004741]/5 dark:bg-[#004741]/20 pl-3.5 py-2 my-2.5 rounded-r-xl italic text-sm text-black/90 dark:text-[#F0EDE4]/90"
        >
          {parseInlineWithMath(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // 7. Bullet Points (- or * or •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const bulletText = trimmed.slice(2);
      elements.push(
        <div
          key={`bullet-${i}`}
          className="flex items-start gap-2.5 my-1 text-sm leading-relaxed text-black/90 dark:text-[#F0EDE4]/90"
        >
          <span className="text-[#004741] dark:text-[#6ee7b7] font-bold mt-1 text-xs select-none">
            •
          </span>
          <div className="flex-1">{parseInlineWithMath(bulletText)}</div>
        </div>
      );
      continue;
    }

    // 8. Numbered Lists
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const rest = numberedMatch[2];
      elements.push(
        <div
          key={`num-${i}`}
          className="flex items-start gap-2.5 my-1 text-sm leading-relaxed text-black/90 dark:text-[#F0EDE4]/90"
        >
          <span className="font-bold text-[#004741] dark:text-[#6ee7b7] text-xs min-w-5 pt-0.5 select-none">
            {num}.
          </span>
          <div className="flex-1">{parseInlineWithMath(rest)}</div>
        </div>
      );
      continue;
    }

    // 9. Empty line
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // 10. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-black/90 dark:text-[#F0EDE4]/90 my-1.5">
        {parseInlineWithMath(line)}
      </p>
    );
  }

  // Flush remaining table if exists
  flushTable('table-flush-end');

  // Flush unclosed code block if exists
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key="code-unclosed"
        code={codeBuffer.join('\n')}
        language={codeLanguage}
      />
    );
  }

  // Flush unclosed math block if exists
  if (inBlockMath && mathBuffer.length > 0) {
    const html = renderMathToHtml(mathBuffer.join('\n'), true);
    elements.push(
      <div
        key="math-unclosed"
        className="my-3.5 p-3 rounded-2xl bg-[#004741]/5 dark:bg-[#004741]/15 border border-[#004741]/20 overflow-x-auto text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={`study-markdown space-y-1 ${className}`}>
      {elements}
    </div>
  );
};
