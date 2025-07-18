"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Account {
  id: string;
  type: "personal" | "team" | "nonprofit";
  name: string;
  role: string;
  dateActive: string;
}

const PERSONAL_ACCOUNT: Account = {
  id: "personal",
  type: "personal",
  name: "Personal Account",
  role: "owner",
  dateActive: new Date().toISOString(),
};

interface AccountContextType {
  selectedAccount: Account;
  setSelectedAccount: (account: Account) => void;
  isPersonalAccount: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const STORAGE_KEY = "chari-ty-selected-account";

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedAccount, setSelectedAccountState] =
    useState<Account>(PERSONAL_ACCOUNT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSelectedAccountState(parsed);
        }
      } catch (error) {
        console.error(
          "Failed to load selected account from localStorage:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    };

    loadFromStorage();
  }, []);

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

  const isPersonalAccount = selectedAccount.id === "personal";

  // Don't render children until we've loaded from localStorage
  if (!isLoaded) {
    return null;
  }

  return (
    <AccountContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        isPersonalAccount,
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

export { PERSONAL_ACCOUNT };
