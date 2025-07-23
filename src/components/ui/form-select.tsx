import * as React from "react";
import { Label } from "@/components/ui/label";
import type { UseFormRegister, Path, FieldValues } from "react-hook-form";

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<TFieldValues extends FieldValues>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name"> {
  label: string;
  name: Path<TFieldValues>;
  options: FormSelectOption[];
  register?: UseFormRegister<TFieldValues>;
  error?: string;
  required?: boolean;
}

export type { FormSelectOption };
export function FormSelect<TFieldValues extends FieldValues>(
  props: FormSelectProps<TFieldValues>
) {
  const {
    label,
    name,
    options,
    required = false,
    register,
    error,
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
      <select
        id={name}
        {...registerProps}
        required={required}
        aria-invalid={!!error}
        className={`w-full rounded-md border border-input bg-background px-3 pt-1 pb-2 h-9 ${
          error ? "border-destructive" : ""
        }`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-destructive text-xs mt-1 block">{error}</span>
      )}
    </div>
  );
}
