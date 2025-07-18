"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";

const PREDEFINED_AMOUNTS = [1, 3, 5, 10, 20, 50, 100, 500, 1000];

const donationSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least $1"),
  isAnonymous: z.boolean(),
  name: z.string().optional(),
  message: z.string().optional(),
});

type DonationForm = z.infer<typeof donationSchema>;

interface DonationDialogProps {
  fundraiser: {
    id: string;
    slug: string;
    title: string;
    currency: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DonationDialog({
  fundraiser,
  isOpen,
  onClose,
}: DonationDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  const form = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 0,
      isAnonymous: false,
      name: "",
      message: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = form;

  const isAnonymous = watch("isAnonymous");
  const amount = watch("amount");

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (data: DonationForm) => {
      const payload = {
        fundraiserId: fundraiser.id,
        amount: data.amount,
        currency: fundraiser.currency,
        isAnonymous: data.isAnonymous,
        name: data.isAnonymous ? undefined : data.name,
        message: data.isAnonymous ? undefined : data.message,
        // successUrl: `${window.location.origin}/fundraisers/${fundraiser.slug}?donation=success`,
        // cancelUrl: `${window.location.origin}/fundraisers/${fundraiser.slug}?donation=cancelled`,
      };

      const response = await api.post(
        "/donations/stripe/create-checkout-session",
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Checkout session creation failed:", error);
    },
  });

  const handleAmountSelect = (selectedAmount: number) => {
    setSelectedAmount(selectedAmount);
    setIsCustomAmount(false);
    setValue("amount", selectedAmount);
  };

  const handleCustomAmountClick = () => {
    setSelectedAmount(null);
    setIsCustomAmount(true);
    setValue("amount", 0);
  };

  const handleClose = () => {
    reset();
    setSelectedAmount(null);
    setIsCustomAmount(false);
    onClose();
  };

  const onSubmit = async (data: DonationForm) => {
    const response = await createCheckoutSessionMutation.mutateAsync(data);
    window.location.href = response.sessionUrl;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: fundraiser.currency,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Donate to {fundraiser.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Choose an amount</Label>

            {/* Predefined Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {PREDEFINED_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant={
                    selectedAmount === presetAmount ? "default" : "outline"
                  }
                  className="h-12"
                  onClick={() => handleAmountSelect(presetAmount)}
                >
                  {formatCurrency(presetAmount)}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Button
                type="button"
                variant={isCustomAmount ? "default" : "outline"}
                className="w-full h-12"
                onClick={handleCustomAmountClick}
              >
                Other amount
              </Button>

              {isCustomAmount && (
                <FormField<DonationForm>
                  label="Enter amount"
                  register={register}
                  name="amount"
                  type="number"
                  required
                  placeholder="0"
                  error={errors.amount?.message}
                />
              )}
            </div>

            {/* Display selected amount */}
            {amount > 0 && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <span className="text-lg font-semibold text-primary">
                  You&apos;re donating {formatCurrency(amount)}
                </span>
              </div>
            )}
          </div>

          {/* Anonymous Toggle */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAnonymous"
                {...register("isAnonymous")}
                className="rounded border-input"
              />
              <Label htmlFor="isAnonymous" className="text-sm font-medium">
                Make this donation anonymous
              </Label>
            </div>

            {/* Name and Message (only if not anonymous) */}
            {!isAnonymous && (
              <div className="space-y-4">
                <FormField<DonationForm>
                  label="Your name (optional)"
                  register={register}
                  name="name"
                  placeholder="Enter your name"
                  error={errors.name?.message}
                />
                <FormField<DonationForm>
                  label="Message (optional)"
                  register={register}
                  name="message"
                  textarea
                  placeholder="Leave a message of support..."
                  error={errors.message?.message}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createCheckoutSessionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={amount <= 0 || createCheckoutSessionMutation.isPending}
              className="min-w-[120px]"
            >
              {createCheckoutSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Donate {amount > 0 ? formatCurrency(amount) : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
