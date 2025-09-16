"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import type { FormSelectOption } from "@/components/ui/form-select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Target, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MediaSection } from "./media-form";

const FUNDRAISER_CATEGORIES = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "disaster_relief", label: "Disaster Relief" },
  { value: "environment", label: "Environment" },
  { value: "animals", label: "Animals" },
  { value: "children", label: "Children" },
  { value: "community", label: "Community" },
  { value: "arts", label: "Arts" },
  { value: "sports", label: "Sports" },
  { value: "food", label: "Food" },
  { value: "housing", label: "Housing" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Other" },
] as const;

const basicInfoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  summary: z.string().min(1, "Summary is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  category: z.string().min(1, "Category is required"),
});

const milestoneSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  purpose: z
    .string()
    .min(1, "Purpose is required")
    .max(500, "Purpose must be less than 500 characters"),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;
type MilestoneData = z.infer<typeof milestoneSchema>;

interface FundraiserMultiFormProps {
  existingCoverUrl?: string;
}

const totalSteps = 3;

export const FundraiserMultiForm = ({
  existingCoverUrl,
}: FundraiserMultiFormProps) => {
  const [step, setStep] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [coverPublicId, setCoverPublicId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    existingCoverUrl || null
  );

  const form = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      category: "other",
    },
    mode: "onTouched",
  });

  const milestoneForm = useForm<MilestoneData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      amount: 0,
      title: "",
      purpose: "",
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = form;

  const {
    handleSubmit: handleMilestoneSubmit,
    register: registerMilestone,
    formState: { errors: milestoneErrors },
    reset: resetMilestone,
  } = milestoneForm;

  const getFieldError = (field: string) =>
    errors[field as keyof typeof errors]?.message;

  const getMilestoneFieldError = (field: string) =>
    milestoneErrors[field as keyof typeof milestoneErrors]?.message;

  const onSubmitBasicInformation = async (formData: unknown) => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      console.log(formData);
      setStep(0);
      reset();
    }
  };

  const onSubmit = () => {
    setShowReview(false); // close modal on submit
    console.log({
      basicInformation: form.getValues(),
      milestones,
      media: coverPublicId,
    });
    toast.success("Form successfully submitted");

    reset(); // reset basic info form
    resetMilestone(); // reset milestone form
    setMilestones([]); // clear milestones
    setCoverPublicId(null); // clear uploaded cover
    setIsUploading(false); // just in case
    setStep(0); // go back to first step
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleAddMilestone = (data: MilestoneData) => {
    setMilestones([...milestones, data]);
    resetMilestone();
    setShowMilestoneForm(false);
    toast.success("Milestone added successfully!");
  };

  const handleCancelMilestone = () => {
    resetMilestone();
    setShowMilestoneForm(false);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md rounded-2xl border border-border">
        <CardContent className="space-y-6 p-6">
          <div className="mt-4">
            <h1 className="text-3xl font-bold mb-1">Create Fundraiser</h1>
            <p className="text-muted-foreground">
              Create a new fundraiser to start raising money for your cause
            </p>
          </div>
          <div className="relative flex items-center w-full">
            {/* Progress line (background) */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-200 -translate-y-1/2 z-0" />

            {/* Progress line (active) */}
            <div
              className="absolute top-1/2 left-0 h-[2px] bg-bla -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />

            {/* TotlatotalSteps */}
            <div className="flex justify-between w-full relative z-10">
              {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNumber = index + 1;
                const isActive = index === step;
                const isCompleted = index < step;

                return (
                  <div
                    key={index}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full border-2 font-medium text-sm",
                      isActive && "bg-black border-black text-white",
                      isCompleted && "bg-gray-500 border-gray-500 text-white",
                      !isActive &&
                        !isCompleted &&
                        "bg-white border-gray-300 text-gray-400"
                    )}
                  >
                    {stepNumber}
                  </div>
                );
              })}
            </div>
          </div>

          {step === 0 && (
            <form
              onSubmit={handleSubmit(onSubmitBasicInformation)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField<BasicInfoData>
                    label="Title"
                    register={register}
                    name="title"
                    placeholder="Enter fundraiser title"
                    error={getFieldError("title")}
                  />
                  <FormSelect
                    label="Category"
                    name="category"
                    options={
                      FUNDRAISER_CATEGORIES as unknown as FormSelectOption[]
                    }
                    register={register}
                    error={getFieldError("category")}
                  />
                </div>
                <FormField<BasicInfoData>
                  label="Summary"
                  register={register}
                  name="summary"
                  placeholder="Brief description"
                  error={getFieldError("summary")}
                />
                <FormField<BasicInfoData>
                  label="Description"
                  register={register}
                  name="description"
                  textarea
                  placeholder="Detailed description"
                  error={getFieldError("description")}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">Next</Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Milestones</h2>

                  {milestones.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMilestoneForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  ) : null}
                </div>

                {milestones.length === 0 ? (
                  <div className="text-center p-12 rounded-lg border-2 border-dashed border-muted-foreground/25 shadow">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No milestones yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add milestones to track your fundraising progress and
                      goals.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowMilestoneForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Milestone
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 border border-border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                              <Target className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">
                                  {milestone.title}
                                </h3>
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  Step {index + 1}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {milestone.purpose}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">
                                  ${milestone.amount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={() => setStep((prevStep) => prevStep + 1)}>
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <MediaSection
                onChange={(id) => {
                  setCoverPublicId(id);
                }}
                coverPublicId={coverPublicId}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                coverImagePreview={coverImagePreview}
                setCoverImagePreview={setCoverImagePreview}
              />
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <div className="flex gap-2">
                  {step === totalSteps - 1 && (
                    <Button
                      variant="secondary"
                      onClick={() => setShowReview(true)}
                    >
                      Review
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={isUploading}
                    onClick={handleSubmit(onSubmit)}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Milestone Form Dialog */}
      <Dialog open={showMilestoneForm} onOpenChange={setShowMilestoneForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleMilestoneSubmit(handleAddMilestone)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<MilestoneData>
                label="Amount"
                register={registerMilestone}
                name="amount"
                type="number"
                placeholder="0"
                error={getMilestoneFieldError("amount")}
              />
              <FormField<MilestoneData>
                label="Title"
                register={registerMilestone}
                name="title"
                placeholder="Milestone title"
                error={getMilestoneFieldError("title")}
              />
            </div>
            <FormField<MilestoneData>
              label="Purpose"
              register={registerMilestone}
              name="purpose"
              textarea
              placeholder="What will this milestone achieve?"
              error={getMilestoneFieldError("purpose")}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelMilestone}
              >
                Cancel
              </Button>
              <Button type="submit">Add Milestone</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fundraiser Review Dialog */}

      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Your Fundraiser</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Info */}
            <section>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <p>
                <strong>Title:</strong> {form.getValues("title")}
              </p>
              <p>
                <strong>Category:</strong> {form.getValues("category")}
              </p>
              <p>
                <strong>Summary:</strong> {form.getValues("summary")}
              </p>
              <p>
                <strong>Description:</strong> {form.getValues("description")}
              </p>
            </section>

            {/* Milestones */}
            <section>
              <h3 className="font-semibold mb-2">Milestones</h3>
              {milestones.length === 0 ? (
                <p className="text-muted-foreground">No milestones added</p>
              ) : (
                <ul className="space-y-3">
                  {milestones.map((m, i) => (
                    <li key={i} className="border p-3 rounded-lg">
                      <p>
                        <strong>Step {i + 1}:</strong> {m.title}
                      </p>
                      <p>
                        <strong>Purpose:</strong> {m.purpose}
                      </p>
                      <p>
                        <strong>Amount:</strong> ${m.amount}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Media */}
            <section>
              <h3 className="font-semibold mb-2">Media</h3>
              {coverPublicId ? (
                <img
                  src={coverImagePreview || ""}
                  alt="Cover"
                  className="w-full max-h-64 object-contain rounded-md border"
                />
              ) : (
                <p className="text-muted-foreground">No cover image selected</p>
              )}
            </section>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowReview(false)}>
              Close
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
