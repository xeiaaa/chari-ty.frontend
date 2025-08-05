import Spinner from "@/components/common/spinner";

interface LoadingPageProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  minHeight?: string;
}

const LoadingPage = ({
  message = "Loading...",
  size = "lg",
  className = "",
  minHeight = "min-h-[400px]",
}: LoadingPageProps) => {
  return (
    <div className={`max-w-6xl mx-auto flex items-center justify-center ${minHeight} ${className}`}>
      <div className="text-center">
        <Spinner size={size} className="mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingPage; 