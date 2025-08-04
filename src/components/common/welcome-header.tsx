interface WelcomeHeaderProps {
  firstName: string;
  message: string;
  className?: string;
}

const WelcomeHeader = ({
  firstName,
  message,
  className = "",
}: WelcomeHeaderProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold mb-1">Welcome, {firstName}!</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default WelcomeHeader;
