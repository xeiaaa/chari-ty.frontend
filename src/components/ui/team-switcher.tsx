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
import {
  useAccount,
  type Account,
  PERSONAL_ACCOUNT,
} from "@/contexts/account-context";

// Helper function to convert Group to Account
const groupToAccount = (group: Group): Account => ({
  id: group.id,
  type:
    group.type === "personal"
      ? "personal"
      : (group.type as "team" | "nonprofit"),
  name: group.name,
  role: group.role,
  dateActive: group.dateActive,
});

export function TeamSwitcher() {
  const { data: groups, isLoading } = useGroups();
  const { selectedAccount, setSelectedAccount } = useAccount();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  const allGroups = [PERSONAL_ACCOUNT, ...(groups || []).map(groupToAccount)];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedAccount.name}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandEmpty>No team found.</CommandEmpty>
          <CommandGroup>
            {allGroups.map((account) => (
              <CommandItem
                key={account.id}
                value={account.name}
                onSelect={() => {
                  setSelectedAccount(account);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedAccount.id === account.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {account.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
