export default function OnboardingPage() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <main style={{ textAlign: "center", maxWidth: 600 }}>
        <h1
          style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Complete Your Onboarding
        </h1>
        <p style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "#444" }}>
          Welcome to Chari-ty! Please complete your onboarding to get started.
        </p>
        {/* TODO: Add onboarding form/steps here */}
      </main>
    </div>
  );
}
