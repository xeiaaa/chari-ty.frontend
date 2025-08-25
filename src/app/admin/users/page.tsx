import PageHeader from "@/components/common/page-header";

export default function AdminUsers() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Users Management"
        message="Manage user accounts, permissions, and platform access."
      />
    </div>
  );
}
