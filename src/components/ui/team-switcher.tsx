import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGroups, type Group } from "@/lib/hooks/use-groups";
import { useState } from "react";
import { Skeleton } from "./skeleton";

const PERSONAL_ACCOUNT: Group = {
  id: "personal",
  type: "personal",
  name: "Personal Account",
  role: "owner",
  dateActive: new Date().toISOString(),
};

export function TeamSwitcher() {
  const { data: groups, isLoading } = useGroups();
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group>(PERSONAL_ACCOUNT);

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  const allGroups = [PERSONAL_ACCOUNT, ...(groups || [])];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedGroup.name}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandEmpty>No team found.</CommandEmpty>
          <CommandGroup>
            {allGroups.map((group) => (
              <CommandItem
                key={group.id}
                value={group.name}
                onSelect={() => {
                  setSelectedGroup(group);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedGroup.id === group.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {group.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
