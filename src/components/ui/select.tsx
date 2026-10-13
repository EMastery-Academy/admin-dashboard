/* oxlint-disable react/only-export-components -- shadcn-style primitives ship parts together */
import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cn("ma-select-trigger", className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <Icon name="chevronEnd" className="ma-icon-dir" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className={cn("ma-select-content", className)} position={position} {...props}>
        <SelectPrimitive.Viewport className="ma-select-viewport">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn("ma-select-item", className)} {...props}>
      <SelectPrimitive.ItemIndicator className="ma-menu__indicator">
        <Icon name="check" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("ma-menu__label", className)} {...props} />;
}
