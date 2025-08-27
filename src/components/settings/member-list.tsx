import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, User, Trash2 } from "lucide-react";

interface Member {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  invitedName: string | null;
  invitedEmail: string | null;
}

interface MemberListProps {
  members: Member[];
  currentUserId?: string;
  currentUserRole?: string;
  accountType: "team" | "nonprofit";
  canInvite: boolean;
  onUpdateRole: (memberId: string, newRole: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
  onInviteMember: () => void;
  isUpdatingRole: boolean;
  isRemovingMember: boolean;
}

const MemberList = ({
  members,
  currentUserId,
  currentUserRole,
  accountType,
  canInvite,
  onUpdateRole,
  onRemoveMember,
  onInviteMember,
  isUpdatingRole,
  isRemovingMember,
}: MemberListProps) => {
  const getAccountTypeLabel = () => {
    return accountType === "team" ? "team" : "organization";
  };

  const canManageMember = (member: Member) => {
    return (
      member.status === "active" &&
      member.user?.id !== currentUserId &&
      member.role !== "owner" &&
      (currentUserRole === "owner" || currentUserRole === "admin")
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage members of your {getAccountTypeLabel()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {members && members.length > 0 ? (
          members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                currentUserId && member.user && member.user.id === currentUserId
                  ? "bg-muted/50 border-primary/20"
                  : ""
              } flex-col md:flex-row gap-4`}
            >
              <div className="flex items-center gap-3 flex-col md:flex-row">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {member.user?.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={`${member.user.firstName} ${member.user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <p className="font-medium md:text-left text-center">
                      {member.user
                        ? `${member.user.firstName} ${member.user.lastName}`
                        : member.invitedName || "Unknown User"}
                    </p>
                    {/* Show "You" badge for current user */}
                    {currentUserId &&
                      member.user &&
                      member.user.id === currentUserId && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                  </div>
                  <p className="text-sm text-muted-foreground md:text-left text-center">
                    {member.user?.email ||
                      member.invitedEmail ||
                      "No email provided"}
                  </p>
                  <p className="text-xs text-muted-foreground md:text-left text-center">
                    Joined: {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center flex-col md:flex-row gap-4">
                <div className="flex gap-2">
                  <Badge
                    variant={
                      member.role === "owner"
                        ? "default"
                        : member.role === "admin"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                  <Badge
                    variant={
                      member.status === "active"
                        ? "default"
                        : member.status === "invited"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {member.status.charAt(0).toUpperCase() +
                      member.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {/* Role management */}
                  {canManageMember(member) && (
                    <select
                      value={member.role}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        onUpdateRole(member.id, e.target.value)
                      }
                      disabled={isUpdatingRole}
                      className="w-24 h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}

                  {/* Remove button */}
                  {canManageMember(member) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onRemoveMember(
                          member.id,
                          member.user
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.invitedName || "Unknown User"
                        )
                      }
                      disabled={isRemovingMember}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No members found</p>
            <p className="text-sm text-muted-foreground">
              Start by inviting team members to collaborate
            </p>
          </div>
        )}

        {/* Invite button */}
        {canInvite && (
          <Button className="w-full" onClick={onInviteMember}>
            <Users className="h-4 w-4 mr-2" />
            Invite New Member
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberList;
