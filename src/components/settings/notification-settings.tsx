import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NotificationSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive email updates about your account
            </p>
          </div>
          <div className="h-6 w-11 bg-muted rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Marketing Emails</p>
            <p className="text-sm text-muted-foreground">
              Receive emails about new features and updates
            </p>
          </div>
          <div className="h-6 w-11 bg-muted rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
