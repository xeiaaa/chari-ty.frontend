import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api";
import { GroupUploadItem } from "@/components/groups/group-gallery-form";

export interface GroupMemberUser {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  accountType: "individual" | "team" | "nonprofit";
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string | null;
  groupId: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "invited" | "removed";
  invitedName: string | null;
  invitedEmail: string | null;
  invitationId: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user: GroupMemberUser | null;
}

export interface GroupDetails {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: "individual" | "team" | "nonprofit";
  avatarUrl?: string;
  website?: string;
  ein?: string;
  documentsUrls?: string[];
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  stripeId?: string | null;
  ownerId: string;
  members: GroupMember[];
  groupUploads: GroupUploadItem[]
}

export function useGroupBySlug(slug: string, enabled: boolean = true) {
  const api = useApi();

  return useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data } = await api.get<GroupDetails>(`/groups/slug/${slug}`);
      return data;
    },
    enabled: enabled && !!slug,
  });
}