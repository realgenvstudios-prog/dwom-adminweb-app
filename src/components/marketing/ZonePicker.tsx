import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Zone } from "../../services/ridersService";

/** Multi-select of delivery zones; an empty selection means every zone. */
export default function ZonePicker({
  id,
  zones,
  value,
  onChange,
}: {
  id?: string;
  zones: Zone[];
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const names = zones.filter((z) => value.includes(z.id)).map((z) => z.name);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {names.length === 0 ? "Every zone" : names.join(", ")}
            </span>
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search zones…" />
          <CommandList>
            <CommandEmpty>No zones found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__all__" onSelect={() => onChange([])}>
                <Check
                  className={cn(
                    value.length === 0 ? "opacity-100" : "opacity-0",
                  )}
                />
                Every zone
              </CommandItem>
              {zones.map((z) => {
                const on = value.includes(z.id);
                return (
                  <CommandItem
                    key={z.id}
                    value={z.name}
                    onSelect={() =>
                      onChange(
                        on
                          ? value.filter((id) => id !== z.id)
                          : [...value, z.id],
                      )
                    }
                  >
                    <Check className={cn(on ? "opacity-100" : "opacity-0")} />
                    {z.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
