"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation } from "@tanstack/react-query";
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
import axios from "axios";
import { Heart, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useApi } from "@/lib/api";

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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function DonationFormContent({
  fundraiser,
  onClose,
}: {
  fundraiser: DonationDialogProps["fundraiser"];
  onClose: () => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const api = useApi();

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
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  const onSubmit = async (data: DonationForm) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      // 1. Create payment intent
      const payload = {
        fundraiserId: fundraiser.id,
        amount: data.amount,
        isAnonymous: data.isAnonymous,
        name: data.isAnonymous ? undefined : data.name,
        message: data.isAnonymous ? undefined : data.message,
      };
      const response = await api.post(
        "/payments/stripe/create-intent",
        payload
      );
      const { clientSecret } = response.data;
      if (!stripe || !elements) {
        setErrorMsg("Stripe is not loaded. Please try again.");
        setIsProcessing(false);
        return;
      }
      // 2. Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: data.name || "Anonymous",
          },
        },
      });
      if (result.error) {
        setErrorMsg(
          result.error.message || "Payment failed. Please try again."
        );
      } else if (
        result.paymentIntent &&
        result.paymentIntent.status === "succeeded"
      ) {
        setSuccessMsg("Thank you for your donation!");
        reset();
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(
          err.response?.data?.message || err.message || "Something went wrong."
        );
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Something went wrong.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: fundraiser.currency,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Amount Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Choose an amount</Label>
        <div className="grid grid-cols-3 gap-2">
          {PREDEFINED_AMOUNTS.map((presetAmount) => (
            <Button
              key={presetAmount}
              type="button"
              variant={selectedAmount === presetAmount ? "default" : "outline"}
              className="h-12"
              onClick={() => handleAmountSelect(presetAmount)}
            >
              {formatCurrency(presetAmount)}
            </Button>
          ))}
        </div>
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
      {/* Card Element */}
      <div>
        <Label className="text-base font-medium">Card details</Label>
        <div className="border rounded-md p-3 bg-white">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>
      {/* Error/Success Messages */}
      {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
      {successMsg && <div className="text-green-600 text-sm">{successMsg}</div>}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={amount <= 0 || isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
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
  );
}

export function DonationDialog({
  fundraiser,
  isOpen,
  onClose,
}: DonationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Donate to {fundraiser.title}
          </DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <DonationFormContent fundraiser={fundraiser} onClose={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
