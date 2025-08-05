interface DonationSummaryProps {
  meta: {
    total: number;
    totalAmount: string;
  };
  completedCount: number;
  formatCurrency: (amount: number, currency: string) => string;
}

const DonationSummary = ({
  meta,
  completedCount,
  formatCurrency,
}: DonationSummaryProps) => {
  return (
    <div className="bg-muted/50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Total Donations</p>
          <p className="text-2xl font-bold">{meta.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold">
            {formatCurrency(Number(meta.totalAmount), "USD")}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold">{completedCount}</p>
        </div>
      </div>
    </div>
  );
};

export default DonationSummary;
