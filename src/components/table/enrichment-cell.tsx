"use client";

import { useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, ExternalLink, Check, X as XIcon } from "lucide-react";
import type { EnrichmentFormat } from "@/lib/exa-types";
import { motion } from "framer-motion";

interface EnrichmentCellProps {
  status?: string;
  value?: string | null;
  format: EnrichmentFormat;
}

export function EnrichmentCell({ status, value, format }: EnrichmentCellProps) {
  const prevStatusRef = useRef(status);
  const shouldReveal = prevStatusRef.current === "pending" && status !== "pending";

  useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

  // Loading state
  if (!status || status === "pending") {
    return <Skeleton className="h-3.5 w-20" />;
  }

  // Canceled state
  if (status === "canceled") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="flex items-center gap-1 text-accent-red text-xs">
            <AlertCircle className="h-3 w-3" />
            Canceled
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Enrichment was canceled</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Empty value
  if (value == null || value === "") {
    return <span className="text-muted-foreground/50 text-xs">--</span>;
  }

  // Wrapper for character-reveal animation
  const RevealWrap = shouldReveal ? motion.span : "span";
  const revealProps = shouldReveal
    ? {
        initial: { opacity: 0, filter: "blur(4px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
        transition: { duration: 0.3 },
      }
    : {};

  // Format-specific rendering
  switch (format) {
    case "email":
      return (
        <RevealWrap {...revealProps}>
          <a
            href={`mailto:${value}`}
            className="text-xs font-mono text-accent-blue hover:underline underline-offset-2 truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        </RevealWrap>
      );
    case "url":
      return (
        <RevealWrap {...revealProps}>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-accent-blue hover:underline underline-offset-2 truncate flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {value.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
          </a>
        </RevealWrap>
      );
    case "phone":
      return (
        <RevealWrap {...revealProps}>
          <a href={`tel:${value}`} className="text-xs font-mono text-accent-blue hover:underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
            {value}
          </a>
        </RevealWrap>
      );
    case "number":
      return (
        <RevealWrap {...revealProps}>
          <span className="text-xs font-mono tabular-nums">{value}</span>
        </RevealWrap>
      );
    case "options": {
      // Boolean-like values get icons
      const lower = value.toLowerCase();
      if (lower === "yes" || lower === "true") {
        return (
          <RevealWrap {...revealProps}>
            <span className="inline-flex items-center gap-1 text-xs text-accent-green">
              <Check className="h-3 w-3" /> Yes
            </span>
          </RevealWrap>
        );
      }
      if (lower === "no" || lower === "false") {
        return (
          <RevealWrap {...revealProps}>
            <span className="inline-flex items-center gap-1 text-xs text-accent-red">
              <XIcon className="h-3 w-3" /> No
            </span>
          </RevealWrap>
        );
      }
      return (
        <RevealWrap {...revealProps}>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {value}
          </span>
        </RevealWrap>
      );
    }
    default:
      return (
        <RevealWrap {...revealProps}>
          <span className="text-xs truncate block max-w-[200px]" title={value}>
            {value}
          </span>
        </RevealWrap>
      );
  }
}
