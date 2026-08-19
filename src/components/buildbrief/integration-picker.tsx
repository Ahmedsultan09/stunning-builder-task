"use client";

import {
  Check,
  CreditCard,
  Mail,
  MessageSquare,
  Sheet,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  INTEGRATIONS,
  type IntegrationId,
} from "@/lib/integrations";
import { cn } from "@/lib/utils";

const ICONS: Record<IntegrationId, LucideIcon> = {
  stripe: CreditCard,
  shopify: ShoppingBag,
  gmail: Mail,
  slack: MessageSquare,
  "google-sheets": Sheet,
};

type IntegrationPickerProps = {
  selected: readonly IntegrationId[];
  onToggle: (id: IntegrationId) => void;
  disabled?: boolean;
};

export function IntegrationPicker({
  selected,
  onToggle,
  disabled = false,
}: IntegrationPickerProps) {
  return (
    <section aria-labelledby="integration-heading" className="space-y-3.5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-semibold text-primary">
            2
          </span>
          <div>
            <h2 id="integration-heading" className="text-sm font-medium">
              Add integration context
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Optional — choose any tools relevant to your idea.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-1 font-mono text-[10px] whitespace-nowrap text-muted-foreground">
          {selected.length} selected
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const Icon = ICONS[integration.id];
          const isSelected = selected.includes(integration.id);

          return (
            <Button
              key={integration.id}
              type="button"
              variant="outline"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onToggle(integration.id)}
              className={cn(
                "relative h-auto min-h-20 items-center justify-start gap-3 rounded-xl border-white/10 bg-background/45 p-3.5 text-left whitespace-normal transition-[border-color,background-color,box-shadow]",
                "hover:border-primary/35 hover:bg-primary/6",
                isSelected &&
                  "border-primary/50 bg-primary/10 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_70%),0_8px_24px_-18px_var(--primary)]",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground",
                  isSelected &&
                    "border-primary/30 bg-primary/15 text-primary",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {integration.name}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                  {integration.description}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-2.5 right-2.5 flex size-4 items-center justify-center rounded-full border border-border text-transparent",
                  isSelected &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
