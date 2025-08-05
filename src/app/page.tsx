import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import { RecentFundraisers } from "@/components/fundraisers/recent-fundraisers";
import { Footer } from "@/components/ui/footer";

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
        <main
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3rem",
            maxWidth: 1000,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: 300, textAlign: "left" }}>
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
              style={{
                fontSize: "1.25rem",
                marginBottom: "2rem",
                color: "#444",
              }}
            >
              Empowering communities through giving. Join us to make a
              difference—sign in or register to get started!
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-start",
              }}
            >
              {/* Auth buttons are in the header */}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 300,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src="/images/charity-word-cloud-heart-concept-56405290.webp"
              alt="Charity and giving concept illustration"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
        </main>

        {/* Recent Fundraisers Section */}
        <RecentFundraisers limit={6} />

        {/* Vision & Goals Section */}
        <section className="w-full max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Vision & Goals: Building Trust Through Transparency
            </h2>
            <p className="italic">
              &quot;Trust is earned through transparency. Transparency is
              achieved through verification. Verification creates lasting
              positive impact.&quot;
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                Our Vision
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To create the world&apos;s most trusted fundraising platform
                where every donation makes a verified impact, every story is
                authentic, and every supporter can see exactly how their
                contribution creates positive change.
              </p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                Core Mission
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Revolutionizing charitable giving by eliminating doubt, fraud,
                and opacity through cutting-edge verification technology and
                radical transparency practices.
              </p>
            </div>
          </div>
        </section>
        <Footer />
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
      <main
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3rem",
          maxWidth: 1000,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 300, textAlign: "left" }}>
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
            className="italic"
          >
            Empowering communities through giving. Join us to make a
            difference—sign in or register to get started!
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-start",
            }}
          >
            {/* Auth buttons are in the header */}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 300,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/charity-word-cloud-heart-concept-56405290.webp"
            alt="Charity and giving concept illustration"
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>
      </main>

      {/* Recent Fundraisers Section */}
      <RecentFundraisers limit={6} />

      {/* Vision & Goals Section */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Vision & Goals: Building Trust Through Transparency
          </h2>
          <p className="italic text-gray-600">
            &quot;Trust is earned through transparency. Transparency is achieved
            through verification. Verification creates lasting positive
            impact.&quot;
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              Our Vision
            </h3>
            <p className="text-gray-600 leading-relaxed">
              To create the world&apos;s most trusted fundraising platform where
              every donation makes a verified impact, every story is authentic,
              and every supporter can see exactly how their contribution creates
              positive change.
            </p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              Core Mission
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Revolutionizing charitable giving by eliminating doubt, fraud, and
              opacity through cutting-edge verification technology and radical
              transparency practices.
            </p>
          </div>
        </div>
      </section>

      {/* Our Commitments Section */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Commitments</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 mb-3">To Donors</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              We pledge to provide complete transparency about where your money
              goes, verify every story we feature, and protect your generous
              contributions from fraud.
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 mb-3">To Fundraisers</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              We commit to supporting legitimate causes with professional tools,
              credibility enhancement, and protection from false accusations
              while maintaining the highest standards.
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 mb-3">To Society</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              We promise to elevate the standards of charitable giving, combat
              fraud in the fundraising space, and create a more trustworthy
              environment for social impact.
            </p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 italic">
            Together, we&apos;re building a future where every act of generosity
            creates verified, transparent, and meaningful change.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
