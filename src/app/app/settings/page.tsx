"use client";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm divide-y divide-border">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                className="rounded-md border border-input bg-background px-3 py-2"
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                className="rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
                placeholder="Tell us about yourself"
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 bg-destructive/5">
          <h2 className="text-xl font-semibold mb-4 text-destructive">
            Danger Zone
          </h2>
          <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
