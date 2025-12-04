"use client"

import type React from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []

    lines.forEach((line, index) => {
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-xl font-bold text-foreground mt-6 mb-3">
            {line.slice(4)}
          </h3>,
        )
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">
            {line.slice(3)}
          </h2>,
        )
      } else if (line.startsWith("# ")) {
        elements.push(
          <h1 key={index} className="text-3xl font-bold text-foreground mt-8 mb-4">
            {line.slice(2)}
          </h1>,
        )
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={index} className="text-foreground ml-4 mb-2">
            {renderInlineStyles(line.slice(2))}
          </li>,
        )
      } else if (line.match(/^\d+\. /)) {
        const content = line.replace(/^\d+\. /, "")
        elements.push(
          <li key={index} className="text-foreground ml-4 mb-2 list-decimal">
            {renderInlineStyles(content)}
          </li>,
        )
      } else if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={index} className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
            {renderInlineStyles(line.slice(2))}
          </blockquote>,
        )
      } else if (line.startsWith("```")) {
        elements.push(
          <code key={index} className="block bg-secondary p-4 rounded-lg my-4 overflow-x-auto">
            {line.slice(3)}
          </code>,
        )
      } else if (line.trim() === "") {
        elements.push(<br key={index} />)
      } else {
        elements.push(
          <p key={index} className="text-foreground mb-3 leading-relaxed">
            {renderInlineStyles(line)}
          </p>,
        )
      }
    })

    return elements
  }

  const renderInlineStyles = (text: string) => {
    let processed = text
    // Bold
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    // Italic
    processed = processed.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Code
    processed = processed.replace(/`(.*?)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-primary">$1</code>')

    return <span dangerouslySetInnerHTML={{ __html: processed }} />
  }

  return <div className="prose prose-invert max-w-none">{renderMarkdown(content)}</div>
}
