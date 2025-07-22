"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGroups } from "../lib/hooks/use-groups";

export interface Account {
  id: string;
  type: "team" | "nonprofit" | "individual";
  name: string;
  role: string;
  dateActive: string;
  slug: string;
}

interface AccountContextType {
  selectedAccount: Account;
  setSelectedAccount: (account: Account) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const STORAGE_KEY = "chari-ty-selected-account";

// Routes that require groups to be loaded
const AUTHENTICATED_ROUTES = ["/app"];

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(
    null
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();

  // Only fetch groups if we're on authenticated routes
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const { data: groups, isLoading: groupsLoading } =
    useGroups(isAuthenticatedRoute);

  // Load from localStorage and set initial account based on groups data
  useEffect(() => {
    // If we're not on authenticated routes, don't try to load groups
    if (!isAuthenticatedRoute) {
      setIsLoaded(true);
      return;
    }

    if (groupsLoading) return;

    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Verify the stored account still exists in groups
          const accountExists = groups?.some((group) => group.id === parsed.id);
          if (accountExists) {
            setSelectedAccountState(parsed);
            setIsLoaded(true);
            return;
          }
        }

        // If no stored account or stored account doesn't exist, set first available group
        if (groups && groups.length > 0) {
          const firstGroup = groups[0];
          const account: Account = {
            id: firstGroup.id,
            type: firstGroup.type as "team" | "nonprofit" | "individual",
            name: firstGroup.name,
            role: firstGroup.role,
            dateActive: firstGroup.dateActive,
            slug: firstGroup.slug,
          };
          setSelectedAccountState(account);
        }
      } catch (error) {
        console.error(
          "Failed to load selected account from localStorage:",
          error
        );
        // Fallback to first group if localStorage fails
        if (groups && groups.length > 0) {
          const firstGroup = groups[0];
          const account: Account = {
            id: firstGroup.id,
            type: firstGroup.type as "team" | "nonprofit" | "individual",
            name: firstGroup.name,
            role: firstGroup.role,
            dateActive: firstGroup.dateActive,
            slug: firstGroup.slug,
          };
          setSelectedAccountState(account);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadFromStorage();
  }, [groups, groupsLoading, isAuthenticatedRoute]);

  // Save to localStorage whenever selection changes
  const setSelectedAccount = (account: Account) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
      setSelectedAccountState(account);
    } catch (error) {
      console.error("Failed to save selected account to localStorage:", error);
      setSelectedAccountState(account);
    }
  };

  // Don't render children until we've loaded from localStorage and groups data
  // On non-authenticated routes, just render immediately since we don't need groups
  if (!isAuthenticatedRoute) {
    return (
      <AccountContext.Provider
        value={{
          selectedAccount: {
            id: "temp",
            type: "individual",
            name: "Loading...",
            role: "owner",
            dateActive: new Date().toISOString(),
            slug: "temp",
          },
          setSelectedAccount,
        }}
      >
        {children}
      </AccountContext.Provider>
    );
  }

  if (!isLoaded || groupsLoading || !selectedAccount) {
    return null;
  }

  return (
    <AccountContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};
