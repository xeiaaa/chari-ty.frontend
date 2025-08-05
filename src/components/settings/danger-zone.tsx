import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DangerZoneProps {
  accountType: "individual" | "team" | "nonprofit";
  onDelete?: () => void;
}

const DangerZone = ({ accountType, onDelete }: DangerZoneProps) => {
  const getDeleteLabel = () => {
    switch (accountType) {
      case "individual":
        return "Account";
      case "team":
        return "Team";
      case "nonprofit":
        return "Organization";
      default:
        return "Account";
    }
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Irreversible and destructive actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onDelete}>
          Delete {getDeleteLabel()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DangerZone;
