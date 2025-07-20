import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormRegister, Path, FieldValues } from "react-hook-form";

interface FormFieldBaseProps<TFieldValues extends FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  register?: UseFormRegister<TFieldValues>;
  error?: string;
  required?: boolean;
}

interface FormFieldInputProps<TFieldValues extends FieldValues>
  extends FormFieldBaseProps<TFieldValues>,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  textarea?: false;
}

interface FormFieldTextareaProps<TFieldValues extends FieldValues>
  extends FormFieldBaseProps<TFieldValues>,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {
  textarea: true;
}

type FormFieldProps<TFieldValues extends FieldValues> =
  | FormFieldInputProps<TFieldValues>
  | FormFieldTextareaProps<TFieldValues>;

export function FormField<TFieldValues extends FieldValues>(
  props: FormFieldProps<TFieldValues>
) {
  const {
    label,
    name,
    required = false,
    register,
    error,
    textarea,
    ...rest
  } = props;

  const registerProps = register ? register(name, { required }) : {};

  return (
    <div className="mb-4 text-left w-full">
      {label && (
        <Label className="mb-1 block" htmlFor={name}>
          {label}
        </Label>
      )}
      {textarea ? (
        <Textarea
          id={name}
          {...registerProps}
          required={required}
          aria-invalid={!!error}
          className={error ? "border-destructive" : ""}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <Input
          id={name}
          {...registerProps}
          required={required}
          aria-invalid={!!error}
          className={error ? "border-destructive" : ""}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && (
        <span className="text-destructive text-xs mt-1 block">{error}</span>
      )}
    </div>
  );
}
