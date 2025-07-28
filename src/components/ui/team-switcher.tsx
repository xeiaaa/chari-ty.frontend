import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { useAccount, type Account } from "@/contexts/account-context";
import { CreateGroupDialog } from "./create-group-dialog";

// Helper function to convert Group to Account
const groupToAccount = (group: Group): Account => ({
  id: group.id,
  type: group.type as "team" | "nonprofit" | "individual",
  name: group.type === "individual" ? "Personal Account" : group.name,
  role: group.role,
  dateActive: group.dateActive,
  slug: group.slug,
});

export function TeamSwitcher() {
  const { data: groups, isLoading } = useGroups();
  const { selectedAccount, setSelectedAccount } = useAccount();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  // Sort groups so that individual (Personal Account) appears first
  const sortedGroups = (groups || []).sort((a, b) => {
    if (a.type === "individual" && b.type !== "individual") return -1;
    if (a.type !== "individual" && b.type === "individual") return 1;
    return 0;
  });

  const allGroups = sortedGroups.map(groupToAccount);

  const handleCreateGroup = () => {
    setOpen(false);
    setCreateDialogOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[200px] justify-between"
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
            <div className="border-t border-border" />
            <CommandGroup>
              <CommandItem value="create-group" onSelect={handleCreateGroup}>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
