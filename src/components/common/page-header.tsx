interface PageHeaderProps {
  title: string;
  message: string;
  className?: string;
}

const PageHeader = ({ title, message, className = "" }: PageHeaderProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold mb-1">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default PageHeader;
