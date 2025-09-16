"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FundraiserMultiForm } from "@/components/fundraisers/fundraiser-multi-form";

export default function CreateFundraiserPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href="/app/fundraisers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Fundraisers
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <FundraiserMultiForm />
      </div>
    </div>
  );
}
