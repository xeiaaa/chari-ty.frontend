import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Link,
  Unlink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface StripeConnectCardProps {
  isConnected: boolean;
  stripeId?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
}

const StripeConnectCard = ({
  isConnected,
  stripeId,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: StripeConnectCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Stripe Connect</CardTitle>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <CardDescription>
          Connect your Stripe account to receive donations from your fundraisers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>
                Your Stripe account is connected and ready to receive donations
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Stripe Account ID: {stripeId}</p>
            </div>
            <Button
              variant="outline"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="flex items-center space-x-2"
            >
              <Unlink className="h-4 w-4" />
              <span>
                {isDisconnecting ? "Disconnecting..." : "Disconnect Stripe"}
              </span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span>
                Connect your Stripe account to start receiving donations
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              You need to connect your Stripe account to receive donations from
              your fundraisers. This will allow you to receive funds directly to
              your bank account.
            </p>
            <Button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center space-x-2"
            >
              <Link className="h-4 w-4" />
              <span>{isConnecting ? "Connecting..." : "Connect Stripe"}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeConnectCard;
