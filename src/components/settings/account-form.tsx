import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AccountFormProps {
  accountType: "individual" | "team" | "nonprofit";
  formData: {
    name: string;
    mission: string;
    website: string;
    ein: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSave: () => void;
  isUpdating: boolean;
  error?: Error | null;
}

const AccountForm = ({
  accountType,
  formData,
  onInputChange,
  onSave,
  isUpdating,
  error,
}: AccountFormProps) => {
  const getAccountTypeLabel = () => {
    switch (accountType) {
      case "individual":
        return "personal";
      case "team":
        return "team";
      case "nonprofit":
        return "organization";
      default:
        return "account";
    }
  };

  const getNameFieldLabel = () => {
    switch (accountType) {
      case "team":
        return "Team Name";
      case "nonprofit":
        return "Organization Name";
      default:
        return "Name";
    }
  };

  const getNameFieldPlaceholder = () => {
    switch (accountType) {
      case "team":
        return "Enter your team name";
      case "nonprofit":
        return "Enter your organization name";
      default:
        return "Enter your name";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your {getAccountTypeLabel()} information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to update settings"}
            </p>
          </div>
        )}

        {/* Name field - required for team and nonprofit */}
        {(accountType === "team" || accountType === "nonprofit") && (
          <div className="grid gap-2">
            <label className="text-sm font-medium">{getNameFieldLabel()}</label>
            <Input
              type="text"
              placeholder={getNameFieldPlaceholder()}
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              required
            />
          </div>
        )}

        {/* EIN field - required for nonprofit */}
        {accountType === "nonprofit" && (
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              EIN (Employer Identification Number)
            </label>
            <Input
              type="text"
              placeholder="XX-XXXXXXX"
              value={formData.ein}
              onChange={(e) => onInputChange("ein", e.target.value)}
              required
            />
          </div>
        )}

        {/* Mission field */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Mission</label>
          <Textarea
            placeholder="What's your mission or purpose?"
            className="min-h-[100px]"
            value={formData.mission}
            onChange={(e) => onInputChange("mission", e.target.value)}
          />
        </div>

        {/* Website field */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Website</label>
          <Input
            type="url"
            placeholder="https://..."
            value={formData.website}
            onChange={(e) => onInputChange("website", e.target.value)}
          />
        </div>

        <Button
          onClick={onSave}
          disabled={isUpdating}
          className="w-full sm:w-auto"
        >
          {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default AccountForm;
