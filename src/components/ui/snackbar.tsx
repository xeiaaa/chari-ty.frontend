"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "./button";

export interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColors = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
};

export function Snackbar({
  open,
  onClose,
  message,
  type = "info",
  duration = 5000,
  action,
}: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  const Icon = icons[type];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-sm ${colors[type]}`}
        >
          <Icon className={`h-5 w-5 flex-shrink-0 ${iconColors[type]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="flex items-center gap-2">
            {action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                className="h-6 px-2 text-xs"
              >
                {action.label}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing snackbar state
export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    type: "info",
  });

  const showSnackbar = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setSnackbar({ open: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    snackbar,
    showSnackbar,
    hideSnackbar,
  };
}
