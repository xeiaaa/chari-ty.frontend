interface PageHeaderProps {
  title: string;
  message: string;
  className?: string;
  rightElement?: React.ReactNode;
}

const PageHeader = ({
  title,
  message,
  className = "",
  rightElement,
}: PageHeaderProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
