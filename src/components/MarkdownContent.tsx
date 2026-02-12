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
        // カスタムコンポーネント
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold mt-6 mb-2 text-gray-900">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="my-4 text-gray-700 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-4 pl-6 list-disc text-gray-700">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 pl-6 list-decimal text-gray-700">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="my-1">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 pl-4 border-l-4 border-blue-500 text-gray-600 italic">
            {children}
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match
          
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-gray-100 text-pink-600 rounded text-sm" {...props}>
                {children}
              </code>
            )
          }
          
          return (
            <code className={`block overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg text-sm ${className}`} {...props}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto">{children}</pre>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            className="text-blue-600 hover:text-blue-800 underline"
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
            className="my-4 rounded-lg max-w-full h-auto"
          />
        ),
        hr: () => (
          <hr className="my-8 border-gray-200" />
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 border-b border-gray-100">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
