"use client";

import { useState } from "react";
import { useSearchUsers, SearchUser } from "@/lib/hooks/use-search-users";
import { useInviteUser } from "@/lib/hooks/use-invite-user";
import { useAccount } from "@/contexts/account-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mail, User } from "lucide-react";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { selectedAccount } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "viewer" | "editor" | "admin"
  >("viewer");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers({
    q: searchQuery,
    limit: 10,
    groupId: selectedAccount.id,
  });

  const { mutate: inviteUser, isPending: isInviting } = useInviteUser();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedUser(null);
    setInviteEmail(null);
  };

  const handleUserSelect = (user: SearchUser) => {
    setSelectedUser(user);
    setInviteEmail(null);
  };

  const handleEmailInvite = (email: string) => {
    setInviteEmail(email);
    setSelectedUser(null);
  };

  const handleInvite = () => {
    if (!selectedUser && !inviteEmail) return;

    const inviteData = {
      userId: selectedUser?.id,
      email: inviteEmail || undefined,
      role: selectedRole,
    };

    inviteUser(
      {
        groupId: selectedAccount.id,
        data: inviteData,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedUser(null);
    setInviteEmail(null);
    setSelectedRole("viewer");
    onOpenChange(false);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim()) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2" />
          <p>Start typing to search for users</p>
        </div>
      );
    }

    if (isSearching) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">Searching...</p>
        </div>
      );
    }

    if (searchResults && searchResults.length > 0) {
      return (
        <div className="space-y-2">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedUser?.id === user.id
                  ? "bg-primary/10 border-primary/20"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleUserSelect(user)}
            >
              <Avatar className="h-8 w-8">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
              <Badge variant="outline">Invite to {selectedAccount.type}</Badge>
            </div>
          ))}
        </div>
      );
    }

    // Only show email invite option if we're not loading and have a valid email
    if (!isSearching && isValidEmail(searchQuery)) {
      return (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            inviteEmail === searchQuery
              ? "bg-primary/10 border-primary/20"
              : "hover:bg-muted/50"
          }`}
          onClick={() => handleEmailInvite(searchQuery)}
        >
          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{searchQuery}</p>
            <p className="text-sm text-muted-foreground">Invite via email</p>
          </div>
          <Badge variant="outline">Invite to {selectedAccount.type}</Badge>
        </div>
      );
    }

    // Only show "No account found" if we're not loading and have search results (empty array)
    if (!isSearching && searchResults && searchResults.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2" />
          <p>No account found for &quot;{searchQuery}&quot;</p>
          <p className="text-sm">Try searching by email, name, or username</p>
        </div>
      );
    }

    // If we're not loading and don't have search results yet, show nothing
    return null;
  };

  const canInvite = selectedUser || inviteEmail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add people to {selectedAccount.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search by email, name, or username
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {renderSearchResults()}
          </div>

          {canInvite && (
            <div className="space-y-3 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <div className="flex gap-2">
                  {(["viewer", "editor", "admin"] as const).map((role) => (
                    <Button
                      key={role}
                      variant={selectedRole === role ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRole(role)}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Inviting:</span>
                <span className="font-medium">
                  {selectedUser ? selectedUser.name : inviteEmail}
                </span>
                <span>as</span>
                <Badge variant="secondary">
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={!canInvite || isInviting}>
              {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedUser ? "Add to" : "Invite to"} {selectedAccount.type}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
