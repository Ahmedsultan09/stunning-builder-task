import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

const markdownComponents = {
  h2: ({ children }: React.ComponentProps<"h2">) => (
    <h2 className="mt-6 mb-2 text-sm font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }: React.ComponentProps<"p">) => (
    <p className="mb-3 text-sm leading-6 text-muted-foreground last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: React.ComponentProps<"ul">) => (
    <ul className="mb-4 space-y-1.5 pl-4 text-sm text-muted-foreground marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }: React.ComponentProps<"ol">) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground marker:text-primary">
      {children}
    </ol>
  ),
  li: ({ children }: React.ComponentProps<"li">) => (
    <li className="pl-1 leading-6">{children}</li>
  ),
  strong: ({ children }: React.ComponentProps<"strong">) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  code: ({ children }: React.ComponentProps<"code">) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  ),
};

type BriefMarkdownProps = {
  className?: string;
  content: string;
};

export function BriefMarkdown({ className, content }: BriefMarkdownProps) {
  return (
    <div className={cn("brief-markdown", className)}>
      <ReactMarkdown skipHtml components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
