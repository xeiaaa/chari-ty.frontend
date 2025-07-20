import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import { RecentFundraisers } from "@/components/fundraisers/recent-fundraisers";

export default async function Home() {
  const { userId, getToken } = await auth();

  if (!userId || !getToken) {
    return (
      <div
        className={styles.page}
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
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Welcome to Chari-ty
          </h1>
          <p
            style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "#444" }}
          >
            Empowering communities through giving. Join us to make a
            difference—sign in or register to get started!
          </p>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
          >
            {/* Auth buttons are in the header */}
          </div>
        </main>

        {/* Recent Fundraisers Section */}
        <RecentFundraisers limit={6} />
      </div>
    );
  }

  let token: string | null = null;
  token = await getToken();

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL not set");
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const user = await res.json();
      if (user?.setupComplete === false) {
        redirect("/onboarding");
      }
    }
  } catch (error) {
    console.error("Failed to fetch /auth/me:", error);
  }

  return (
    <div
      className={styles.page}
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
          Welcome to Chari-ty
        </h1>
        <p style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "#444" }}>
          Empowering communities through giving. Join us to make a
          difference—sign in or register to get started!
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          {/* Auth buttons are in the header */}
        </div>
      </main>

      {/* Recent Fundraisers Section */}
      <RecentFundraisers limit={6} />
    </div>
  );
}
