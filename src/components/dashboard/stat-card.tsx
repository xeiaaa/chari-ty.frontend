import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  iconPosition?: "left" | "top" | "right";
  variant?: "default" | "compact" | "detailed";
}

/**
 * StatCard - A reusable component for displaying statistics in a card format
 *
 * @example
 * // Basic usage
 * <StatCard
 *   title="Total Revenue"
 *   value="$10,000"
 *   description="This month"
 * />
 *
 * @example
 * // With icon
 * <StatCard
 *   title="Active Users"
 *   value={150}
 *   description="Online now"
 *   icon={<Users className="w-5 h-5 text-blue-500" />}
 * />
 *
 * @example
 * // Compact variant with top icon
 * <StatCard
 *   title="Conversion Rate"
 *   value="12.5%"
 *   description="Last 30 days"
 *   icon={<TrendingUp className="w-6 h-6 text-green-500" />}
 *   iconPosition="top"
 *   variant="compact"
 * />
 */
export function StatCard({
  title,
  value,
  description,
  icon,
  className = "",
  titleClassName = "text-sm font-medium text-muted-foreground",
  valueClassName = "text-2xl font-bold",
  descriptionClassName = "text-xs text-muted-foreground",
  iconPosition = "left",
  variant = "default",
}: StatCardProps) {
  const renderIcon = () => {
    if (!icon) return null;

    const iconClasses = cn(
      "flex-shrink-0",
      iconPosition === "top" && "mb-2",
      iconPosition === "right" && "ml-auto"
    );

    return <div className={iconClasses}>{icon}</div>;
  };

  const renderTitle = () => {
    if (iconPosition === "top") {
      return (
        <div className="text-center">
          {renderIcon()}
          <CardTitle className={titleClassName}>{title}</CardTitle>
        </div>
      );
    }

    if (iconPosition === "right") {
      return (
        <div className="flex items-center justify-between">
          <CardTitle className={titleClassName}>{title}</CardTitle>
          {renderIcon()}
        </div>
      );
    }

    // Default left position
    return (
      <CardTitle className={`flex items-center gap-2 ${titleClassName}`}>
        {renderIcon()}
        {title}
      </CardTitle>
    );
  };

  const cardClasses = cn(
    "transition-all duration-200",
    variant === "compact" && "p-4",
    variant === "detailed" && "p-6",
    className
  );

  const contentClasses = cn(
    variant === "compact" && "space-y-1",
    variant === "detailed" && "space-y-3"
  );

  return (
    <Card className={cardClasses}>
      <CardHeader className={cn("pb-2", variant === "compact" && "pb-1")}>
        {renderTitle()}
      </CardHeader>
      <CardContent className={contentClasses}>
        <div className={valueClassName}>{value}</div>
        {description && <p className={descriptionClassName}>{description}</p>}
      </CardContent>
    </Card>
  );
}
