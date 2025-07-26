"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FormField } from "@/components/ui/form-field";
import { useRouter } from "next/navigation";
import { useApi, getErrorMessage } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const ACCOUNT_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "team", label: "Team" },
  { value: "nonprofit", label: "Nonprofit" },
] as const;

// TEAM_MEMBER_ROLES - COMMENTED OUT FOR LATER USE
// const TEAM_MEMBER_ROLES = [
//   { value: "viewer", label: "Viewer" },
//   { value: "editor", label: "Editor" },
//   { value: "admin", label: "Admin" },
// ] as const;

// Zod schema matching backend DTO validation
const teamMemberSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().optional(),
  role: z.enum(["viewer", "editor", "admin"]),
});

const baseSchema = z.object({
  accountType: z.enum(["individual", "team", "nonprofit"]),
  bio: z.string().max(500).optional(),
  avatarUrl: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL or empty",
    })
    .optional(),
  mission: z.string().max(500).optional(),
  website: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL or empty",
    })
    .optional(),
  documentsUrls: z.array(z.string().url()).optional(),
});

const onboardingSchema = z.discriminatedUnion("accountType", [
  // Individual account
  baseSchema.extend({
    accountType: z.literal("individual"),
  }),

  // Team account
  baseSchema.extend({
    accountType: z.literal("team"),
    name: z.string().min(2).max(100),
    members: z.array(teamMemberSchema).optional(),
  }),

  // Nonprofit account
  baseSchema.extend({
    accountType: z.literal("nonprofit"),
    name: z.string().min(2).max(100),
    ein: z.string().min(9).max(10),
    members: z.array(teamMemberSchema).optional(),
  }),
]);

type OnboardingForm = z.infer<typeof onboardingSchema>;

// Upload signature type
interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

// Payload type for onboarding submission
interface OnboardingPayload {
  accountType: string;
  name?: string;
  ein?: string;
  bio?: string;
  avatarUrl?: string;
  mission?: string;
  website?: string;
  documentsUrls?: string[];
}

const defaultValues: Partial<OnboardingForm> = {
  bio: "",
  avatarUrl: "",
  mission: "",
  website: "",
  documentsUrls: [],
};

const steps = ["Account Type", "Details", "Review & Confirm"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const api = useApi();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarImage, setAvatarImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, submitCount },
    trigger,
    setValue,
  } = form;

  const accountType = watch("accountType");

  // Initialize form fields when account type changes
  React.useEffect(() => {
    if (accountType === "team") {
      setValue("name", "", { shouldValidate: true });
      setValue("mission", "");
      setValue("website", "");
      // setValue("members", [{ name: "", email: "", role: "viewer" }], {
      //   shouldValidate: true,
      // });
      // setValue("documentsUrls", []);
      // setDocuments([""]);
    } else if (accountType === "nonprofit") {
      setValue("name", "", { shouldValidate: true });
      setValue("mission", "");
      setValue("website", "");
      setValue("ein", "", { shouldValidate: true });
      // setValue("members", [{ name: "", email: "", role: "viewer" }], {
      //   shouldValidate: true,
      // });
      // setValue("documentsUrls", []);
      // setDocuments([""]);
    } else if (accountType === "individual") {
      setValue("mission", "");
      setValue("website", "");
      // setValue("documentsUrls", []);
      // setDocuments([""]);
    }
  }, [accountType, setValue]);

  // Upload mutations
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "avatars",
      });
      return response.data as UploadSignature;
    },
  });

  const uploadToCloudinaryMutation = useMutation({
    mutationFn: async ({
      file,
      signature,
    }: {
      file: File;
      signature: UploadSignature;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", signature.timestamp.toString());
      formData.append("signature", signature.signature);
      formData.append("folder", "avatars");

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
  });

  // File upload handler
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      // Get upload signature
      const signature = await getUploadSignatureMutation.mutateAsync();

      // Upload to Cloudinary
      const result = await uploadToCloudinaryMutation.mutateAsync({
        file,
        signature,
      });

      return result.secure_url;
    } catch {
      throw new Error("Failed to upload image");
    }
  };

  // File selection handler
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image size must be less than 5MB");
        return;
      }

      setAvatarImage(file);
      setUploadError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarImage(null);
    setAvatarPreview(null);
    setValue("avatarUrl", "");
    setUploadError(null);
  };

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

  // Check if required fields are filled based on account type
  const areRequiredFieldsFilled = () => {
    const values = form.getValues();

    if (!accountType) return false;

    if (accountType === "individual") {
      // Individual has no required fields
      return true;
    }

    if (accountType === "team") {
      // Team requires name
      const teamValues = values as { name?: string };
      return !!(teamValues.name && teamValues.name.trim());
    }

    if (accountType === "nonprofit") {
      // Nonprofit requires name and ein
      const nonprofitValues = values as { name?: string; ein?: string };
      return !!(
        nonprofitValues.name &&
        nonprofitValues.name.trim() &&
        nonprofitValues.ein &&
        nonprofitValues.ein.trim()
      );
    }

    return false;
  };

  const onSubmit = async (data: OnboardingForm) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let avatarUrl = data.avatarUrl;

      // Upload avatar image if selected
      if (avatarImage) {
        avatarUrl = await handleFileUpload(avatarImage);
      }

      // Filter out empty optional fields
      const payload: OnboardingPayload = {
        accountType: data.accountType,
        ...(data.bio && data.bio.trim() && { bio: data.bio.trim() }),
        ...(avatarUrl && avatarUrl.trim() && { avatarUrl: avatarUrl.trim() }),
        ...(data.mission &&
          data.mission.trim() && { mission: data.mission.trim() }),
        ...(data.website &&
          data.website.trim() && { website: data.website.trim() }),
        ...(data.documentsUrls &&
          data.documentsUrls.length > 0 && {
            documentsUrls: data.documentsUrls,
          }),
      };

      // Add account type specific fields
      if (data.accountType === "team" || data.accountType === "nonprofit") {
        const teamNonprofitData = data as { name?: string };
        if (teamNonprofitData.name && teamNonprofitData.name.trim()) {
          payload.name = teamNonprofitData.name.trim();
        }
      }

      if (data.accountType === "nonprofit") {
        const nonprofitData = data as { ein?: string };
        if (nonprofitData.ein && nonprofitData.ein.trim()) {
          payload.ein = nonprofitData.ein.trim();
        }
      }

      await api.post("/auth/onboarding", payload);
      router.push("/app/dashboard");
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
    const commonFields = [
      "bio",
      "avatarUrl",
      "mission",
      "website",
      "documentsUrls",
    ];
    const teamFields = [...commonFields, "name", "members"];
    const nonprofitFields = [...commonFields, "name", "ein", "members"];

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

  // Helper function to safely access array field errors - COMMENTED OUT FOR LATER USE
  // const getArrayFieldError = (
  //   field: string,
  //   index: number,
  //   subField: string
  // ) => {
  //   if (!errors || !accountType) return "";

  //   if (
  //     field === "members" &&
  //     (accountType === "team" || accountType === "nonprofit")
  //   ) {
  //     const memberErrors = errors as {
  //       members?: {
  //       name?: { message: string };
  //       email?: { message: string };
  //       role?: { message: string };
  //     }[];
  //   };
  //   return (
  //     memberErrors.members?.[index]?.[
  //       subField as keyof (typeof memberErrors.members)[number]
  //     ]?.message ?? ""
  //   );
  // }

  //   if (field === "documentsUrls") {
  //     const docErrors = errors as {
  //       documentsUrls?: { message: string }[];
  //     };
  //     return docErrors.documentsUrls?.[index]?.message ?? "";
  //   }

  //   return "";
  // };

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
                {/* Name field - required for team and nonprofit */}
                {(accountType === "team" || accountType === "nonprofit") && (
                  <FormField<OnboardingForm>
                    label={
                      accountType === "team" ? "Team Name" : "Organization Name"
                    }
                    register={register}
                    name="name"
                    required
                    error={
                      "name" in touchedFields || submitCount > 0
                        ? getFieldError("name")
                        : undefined
                    }
                  />
                )}

                {/* EIN field - required for nonprofit */}
                {accountType === "nonprofit" && (
                  <FormField<OnboardingForm>
                    label="EIN"
                    register={register}
                    name="ein"
                    required
                    placeholder="XX-XXXXXXX"
                    error={
                      "ein" in touchedFields || submitCount > 0
                        ? getFieldError("ein")
                        : undefined
                    }
                  />
                )}

                {/* Avatar upload field */}
                <div className="flex flex-col gap-2">
                  <label className="block font-medium mb-1">Avatar</label>
                  <div className="flex flex-col gap-4">
                    {/* Avatar preview */}
                    {(avatarPreview || form.getValues("avatarUrl")) && (
                      <div className="relative inline-block">
                        <img
                          src={avatarPreview || form.getValues("avatarUrl")}
                          alt="Avatar preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    {/* File input */}
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        {avatarImage ? "Change Avatar" : "Upload Avatar"}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>

                    {/* Upload error */}
                    {uploadError && (
                      <p className="text-sm text-destructive">{uploadError}</p>
                    )}

                    {/* Upload loading state */}
                    {(getUploadSignatureMutation.isPending ||
                      uploadToCloudinaryMutation.isPending) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>

                {/* Common fields */}
                <FormField<OnboardingForm>
                  label="Bio"
                  register={register}
                  textarea
                  name="bio"
                  placeholder="Tell us about yourself or your group"
                  error={getFieldError("bio")}
                />
                <FormField<OnboardingForm>
                  label="Mission"
                  register={register}
                  textarea
                  name="mission"
                  placeholder="What's your mission or purpose?"
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

                {/* Members field - optional for team and nonprofit - COMMENTED OUT FOR LATER USE */}
                {/* {(accountType === "team" || accountType === "nonprofit") && (
                  <div className="flex flex-col gap-2">
                    <span className="block font-medium mb-1">
                      {accountType === "team"
                        ? "Team Members"
                        : "Organization Members"}
                    </span>
                    {memberFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start">
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
                          error={getArrayFieldError("members", index, "email")}
                        />
                        <div className="w-xs">
                          <FormSelect
                            label="Role"
                            name={`members.${index}.role` as const}
                            options={
                              TEAM_MEMBER_ROLES as unknown as FormSelectOption[]
                            }
                            register={register}
                            error={getArrayFieldError("members", index, "role")}
                          />
                        </div>
                        <div className="self-center">
                          {memberFields.length - 1 !== index && (
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
                )} */}

                {/* Documents field - optional for all account types - COMMENTED OUT FOR LATER USE */}
                {/* <div className="flex flex-col gap-2">
                  <span className="block font-medium mb-1">Documents</span>
                  {documents.map((doc, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <FormField<OnboardingForm>
                        label="Document URL"
                        register={register}
                        name={`documentsUrls.${index}` as const}
                        type="url"
                        placeholder="https://..."
                        value={doc}
                        onChange={(e) => {
                          const newDocs = [...documents];
                          newDocs[index] = e.target.value;
                          setDocuments(newDocs);
                          setValue(`documentsUrls.${index}`, e.target.value);
                        }}
                        error={getArrayFieldError("documentsUrls", index, "")}
                      />
                      <div className="self-center">
                        {div className="self-center">
                        {documents.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newDocs = documents.filter(
                                (_, i) => i !== index
                              );
                              setDocuments(newDocs);
                              setValue("documentsUrls", newDocs);
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newDocs = [...documents, ""];
                      setDocuments(newDocs);
                      setValue("documentsUrls", newDocs);
                    }}
                  >
                    Add Document
                  </Button>
                </div> */}

                <div className="flex gap-4 justify-between mt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!areRequiredFieldsFilled()}
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
