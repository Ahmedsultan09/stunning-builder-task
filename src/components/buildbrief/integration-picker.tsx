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
    <section aria-labelledby="integration-heading" className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="integration-heading" className="text-sm font-medium">
            Add integration context
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo integrations only — no external accounts are connected.
          </p>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {selected.length}/{INTEGRATIONS.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
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
                "relative h-auto min-h-24 items-start justify-start gap-3 rounded-xl p-3 text-left whitespace-normal transition-[border-color,background-color,box-shadow]",
                "hover:border-primary/40 hover:bg-primary/5",
                isSelected &&
                  "border-primary/55 bg-primary/10 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_65%)]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground",
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
                <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
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
