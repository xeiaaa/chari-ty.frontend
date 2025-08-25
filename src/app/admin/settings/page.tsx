import PageHeader from "@/components/common/page-header";

export default function AdminSettings() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="System Settings"
        message="Configure platform settings, security options, and system preferences."
      />
    </div>
  );
}
