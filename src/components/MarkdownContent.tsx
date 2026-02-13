'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-10 mb-4 text-white">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-8 mb-3 text-white">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-6 mb-2 text-white">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold mt-5 mb-2 text-white">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="my-5 text-text-secondary leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-4 pl-6 list-disc text-text-secondary space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 pl-6 list-decimal text-text-secondary space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-6 pl-4 border-l-3 border-accent text-text-muted italic">
            {children}
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match
          
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-surface text-accent rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          }
          
          return (
            <code className={`block overflow-x-auto p-4 bg-surface text-text-secondary rounded-lg text-sm font-mono border border-surface-border ${className}`} {...props}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="my-6 overflow-x-auto">{children}</pre>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            className="text-accent hover:text-accent-hover underline underline-offset-2"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={src} 
            alt={alt || ''} 
            className="my-6 rounded-lg max-w-full h-auto"
          />
        ),
        hr: () => (
          <hr className="my-10 border-surface-border" />
        ),
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto">
            <table className="min-w-full border border-surface-border rounded-lg">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-4 py-3 bg-surface border-b border-surface-border text-left font-semibold text-white">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 border-b border-surface-border text-text-secondary">{children}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
