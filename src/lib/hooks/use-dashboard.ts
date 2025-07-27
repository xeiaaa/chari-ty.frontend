import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api';

export interface DashboardData {
  fundraising: {
    activeFundraisers: number;
    totalRaised: number;
    goalCompletionRate: {
      completed: number;
      total: number;
    };
    avgDonationPerFundraiser: number;
  };
  team: {
    members: number;
    pendingInvitations: number;
    lastMemberJoined: {
      name: string;
      date: string;
    };
  };
  recentActivity: Array<{
    type: 'fundraiser_created' | 'donation_received' | 'member_joined';
    user: string;
    action: string;
    target?: string;
    amount?: string;
    date: string;
  }>;
  highlights: {
    topPerforming: {
      name: string;
      raised?: number;
      goal?: number;
    };
    mostRecent: {
      name: string;
      created?: string;
      raised?: number;
    };
    mostDonatedToday: {
      name: string;
      donations?: number;
      amount?: number;
    };
  };
}

export const useDashboard = (groupSlug: string) => {
  const api = useApi();

  return useQuery({
    queryKey: ['dashboard', groupSlug],
    queryFn: async (): Promise<DashboardData> => {
      const response = await api.get(`/groups/slug/${groupSlug}/dashboard`);
      return response.data;
    },
    enabled: !!groupSlug,
  });
};