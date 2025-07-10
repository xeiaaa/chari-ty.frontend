"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useApi, getErrorMessage } from "@/lib/api";

const ACCOUNT_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "team", label: "Team" },
  { value: "nonprofit", label: "Nonprofit" },
] as const;

const TEAM_MEMBER_ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
] as const;

// Zod schema matching backend DTO validation
const teamMemberSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().optional(),
  role: z.enum(["viewer", "editor", "admin"]),
});

const baseSchema = z.object({
  accountType: z.enum(["individual", "team", "nonprofit"]),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

const onboardingSchema = z.discriminatedUnion("accountType", [
  // Individual account
  baseSchema.extend({
    accountType: z.literal("individual"),
  }),

  // Team account
  baseSchema.extend({
    accountType: z.literal("team"),
    teamName: z.string().min(2).max(100),
    mission: z.string().max(500).optional(),
    website: z.string().url().optional(),
    members: z.array(teamMemberSchema),
  }),

  // Nonprofit account
  baseSchema.extend({
    accountType: z.literal("nonprofit"),
    organizationName: z.string().min(2).max(100),
    mission: z.string().max(500).optional(),
    website: z.string().url().optional(),
    ein: z.string().min(9).max(10),
    documentsUrls: z.array(z.object({ url: z.string().url() })).optional(),
  }),
]);

type OnboardingForm = z.infer<typeof onboardingSchema>;

const defaultValues: Partial<OnboardingForm> = {
  bio: "",
  avatarUrl: "",
};

const steps = ["Account Type", "Details", "Review & Confirm"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const api = useApi();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue,
  } = form;

  const accountType = watch("accountType");

  // Initialize form fields when account type changes
  React.useEffect(() => {
    if (accountType === "team") {
      setValue("teamName", "", { shouldValidate: true });
      setValue("mission", "");
      setValue("website", "");
      setValue("members", [{ name: "", email: "", role: "viewer" }], {
        shouldValidate: true,
      });
    } else if (accountType === "nonprofit") {
      setValue("organizationName", "", { shouldValidate: true });
      setValue("mission", "");
      setValue("website", "");
      setValue("ein", "", { shouldValidate: true });
      setValue("documentsUrls", [{ url: "" }]);
    }
  }, [accountType, setValue]);

  // Team members array
  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "members",
    rules: { required: accountType === "team" },
  });

  // Nonprofit documents array
  const {
    fields: docFields,
    append: appendDoc,
    remove: removeDoc,
  } = useFieldArray({
    control,
    name: "documentsUrls",
    rules: { required: false },
  });

  const handleNext = async () => {
    if (step === 0) {
      if (!accountType) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      const valid = await trigger();
      if (valid) setStep(2);
      return;
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (data: OnboardingForm) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await api.post("/auth/onboarding", data);
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to safely access errors
  const getFieldError = (field: string) => {
    if (!errors || !accountType) return undefined;

    // Only show errors for fields relevant to the current account type
    const commonFields = ["bio", "avatarUrl"];
    const teamFields = [
      ...commonFields,
      "teamName",
      "mission",
      "website",
      "members",
    ];
    const nonprofitFields = [
      ...commonFields,
      "organizationName",
      "mission",
      "website",
      "ein",
      "documentsUrls",
    ];

    if (accountType === "individual" && commonFields.includes(field)) {
      return errors[field as keyof typeof errors]?.message;
    }

    if (accountType === "team" && teamFields.includes(field)) {
      return errors[field as keyof typeof errors]?.message;
    }

    if (accountType === "nonprofit" && nonprofitFields.includes(field)) {
      return errors[field as keyof typeof errors]?.message;
    }

    return undefined;
  };

  // Helper function to safely access array field errors
  const getArrayFieldError = (
    field: string,
    index: number,
    subField: string
  ) => {
    if (!errors || !accountType) return "";

    if (field === "members" && accountType === "team") {
      const teamErrors = errors as {
        members?: {
          name?: { message: string };
          email?: { message: string };
          role?: { message: string };
        }[];
      };
      return (
        teamErrors.members?.[index]?.[
          subField as keyof (typeof teamErrors.members)[number]
        ]?.message ?? ""
      );
    }

    if (field === "documentsUrls" && accountType === "nonprofit") {
      const nonprofitErrors = errors as {
        documentsUrls?: { url?: { message: string } }[];
      };
      return (
        nonprofitErrors.documentsUrls?.[index]?.[
          subField as keyof (typeof nonprofitErrors.documentsUrls)[number]
        ]?.message ?? ""
      );
    }

    return "";
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background py-8 px-2">
      <main className="w-full max-w-lg">
        <div className="bg-card border border-border rounded-2xl shadow-lg px-6 py-8 sm:px-10 sm:py-10 flex flex-col gap-8">
          <LogoAndProgress step={step} />
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-8"
          >
            {step === 0 && (
              <div className="flex flex-col gap-8 items-center">
                <h2 className="text-2xl font-semibold">Choose Account Type</h2>
                <div className="flex gap-4 w-full justify-center">
                  {ACCOUNT_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={
                        accountType === type.value ? "secondary" : "outline"
                      }
                      size="lg"
                      onClick={() => form.setValue("accountType", type.value)}
                      className="min-w-[120px] text-base"
                      aria-pressed={accountType === type.value}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
                {errors.accountType?.message && (
                  <span className="text-destructive text-sm">
                    {errors.accountType.message}
                  </span>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!accountType}
                  className="w-full max-w-xs mt-2"
                  type="button"
                >
                  Next
                </Button>
              </div>
            )}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                {/* Common fields */}
                <FormField<OnboardingForm>
                  label="Avatar URL"
                  register={register}
                  name="avatarUrl"
                  type="url"
                  placeholder="https://..."
                  error={getFieldError("avatarUrl")}
                />
                <FormField<OnboardingForm>
                  label="Bio"
                  register={register}
                  textarea
                  name="bio"
                  placeholder="Tell us about yourself or your group"
                  error={getFieldError("bio")}
                />

                {/* Team fields */}
                {accountType === "team" && (
                  <>
                    <FormField<OnboardingForm>
                      label="Team Name"
                      register={register}
                      name="teamName"
                      required
                      error={getFieldError("teamName")}
                    />
                    <FormField<OnboardingForm>
                      label="Mission"
                      register={register}
                      textarea
                      name="mission"
                      error={getFieldError("mission")}
                    />
                    <FormField<OnboardingForm>
                      label="Website"
                      register={register}
                      name="website"
                      type="url"
                      placeholder="https://..."
                      error={getFieldError("website")}
                    />
                    <div className="flex flex-col gap-2">
                      <span className="block font-medium mb-1">
                        Team Members
                      </span>
                      {memberFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                          <FormField<OnboardingForm>
                            label="Name"
                            register={register}
                            name={`members.${index}.name` as const}
                            required
                            error={getArrayFieldError("members", index, "name")}
                          />
                          <FormField<OnboardingForm>
                            label="Email"
                            register={register}
                            name={`members.${index}.email` as const}
                            type="email"
                            error={getArrayFieldError(
                              "members",
                              index,
                              "email"
                            )}
                          />
                          <div className="flex-1">
                            <Label className="mb-1 block">Role</Label>
                            <select
                              {...register(`members.${index}.role` as const)}
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              {TEAM_MEMBER_ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeMember(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          appendMember({ name: "", email: "", role: "viewer" })
                        }
                      >
                        Add Member
                      </Button>
                    </div>
                  </>
                )}

                {/* Nonprofit fields */}
                {accountType === "nonprofit" && (
                  <>
                    <FormField<OnboardingForm>
                      label="Organization Name"
                      register={register}
                      name="organizationName"
                      required
                      error={getFieldError("organizationName")}
                    />
                    <FormField<OnboardingForm>
                      label="EIN"
                      register={register}
                      name="ein"
                      required
                      placeholder="XX-XXXXXXX"
                      error={getFieldError("ein")}
                    />
                    <div className="flex flex-col gap-2">
                      <span className="block font-medium mb-1">Documents</span>
                      {docFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                          <FormField<OnboardingForm>
                            label="Document URL"
                            register={register}
                            name={`documentsUrls.${index}.url` as const}
                            type="url"
                            placeholder="https://..."
                            error={getArrayFieldError(
                              "documentsUrls",
                              index,
                              "url"
                            )}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeDoc(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendDoc({ url: "" })}
                      >
                        Add Document
                      </Button>
                    </div>
                  </>
                )}

                <div className="flex gap-4 justify-between mt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isValid}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-8">
                <h2 className="text-2xl font-semibold">Review & Confirm</h2>
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(form.getValues(), null, 2)}
                </pre>
                {error && (
                  <div className="text-destructive text-sm">{error}</div>
                )}
                <div className="flex gap-4 justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Completing..." : "Complete Onboarding"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

const LogoAndProgress = ({ step }: { step: number }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold">Welcome to Chari-ty</h1>
        <p className="text-muted-foreground">Complete your account setup</p>
      </div>
      <div className="w-full max-w-xs">
        <Progress value={((step + 1) / steps.length) * 100} />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          {steps.map((s, i) => (
            <span
              key={s}
              className={i === step ? "font-medium text-foreground" : ""}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
