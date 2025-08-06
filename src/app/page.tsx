import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RecentFundraisers } from "@/components/fundraisers/recent-fundraisers";
import { CategoryCards } from "@/components/fundraisers/category-cards";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HomeContent = ({ isAuthenticated }: { isAuthenticated: boolean }) => (
  <div className="min-h-[calc(100vh-69px)] flex flex-col items-center justify-center bg-background px-4">
    <main className="flex items-center gap-8 max-w-[1000px] flex-wrap justify-center max-[700px]:h-auto h-[calc(100vh-69px)] pt-12 md:pt-0 px-4">
      <div className="flex-1 min-w-[300px] text-center sm:text-left">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Welcome to{" "}
          <span className="bg-gradient-to-b from-blue-300 to-blue-800 bg-clip-text text-transparent">
            Chari
          </span>
          <span className="bg-gradient-to-b from-purple-400 to-pink-600 bg-clip-text text-transparent">
            ty
          </span>
        </h1>
        <p className="text-xl mb-8 text-gray-700 leading-relaxed">
          Empowering communities through giving. Join us to make a
          difference—sign in or register to get started!
        </p>
        <div className="flex gap-4 justify-center sm:justify-start">
          {!isAuthenticated && (
            <>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/fundraisers">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 font-semibold border-2 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                >
                  Explore Causes
                </Button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link href="/app/dashboard">
                <Button
                  size="lg"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/fundraisers">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 font-semibold border-2 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                >
                  Explore Causes
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-[300px] flex justify-center">
        <img
          src="/images/heart.png"
          alt="Charity and giving concept illustration"
          className="max-w-[80%] h-auto opacity-90"
        />
      </div>
    </main>

    {/* Recent Fundraisers Section */}
    <RecentFundraisers limit={6} />

    {/* Fundraising Categories Section */}
    <CategoryCards />

    {/* Vision & Goals Section */}
    <section className="w-full py-16 bg-gray-50/50">
      <div className="w-full px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-8 text-gray-900">
              Vision & Goals: Building Trust Through Transparency
            </h2>
            <blockquote className="text-lg text-gray-700 italic leading-relaxed max-w-4xl mx-auto">
              &ldquo;Trust is earned through transparency. Transparency is
              achieved through verification. Verification creates lasting
              positive impact.&rdquo;
            </blockquote>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  Our Vision
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To create the world&apos;s most trusted fundraising platform
                where every donation makes a verified impact, every story is
                authentic, and every supporter can see exactly how their
                contribution creates positive change.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  Core Mission
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Revolutionizing charitable giving by eliminating doubt, fraud,
                and opacity through cutting-edge verification technology and
                radical transparency practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Our Commitments Section - Available for all users */}
    <section className="w-full py-16">
      <div className="w-full px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Our Commitments
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We are committed to building a platform that serves everyone
              involved in the charitable giving ecosystem with integrity and
              transparency.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-4 text-xl">
                To Donors
              </h4>
              <p className="text-gray-600 leading-relaxed">
                We pledge to provide complete <strong>transparency</strong>{" "}
                about where your money goes, verify every story we feature, and
                protect your generous contributions from fraud.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors duration-300">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-4 text-xl">
                To Fundraisers
              </h4>
              <p className="text-gray-600 leading-relaxed">
                We commit to supporting <strong>legitimate causes</strong> with
                professional tools, credibility enhancement, and protection from
                false accusations while maintaining the highest standards.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-4 text-xl">
                To Society
              </h4>
              <p className="text-gray-600 leading-relaxed">
                We promise to elevate the standards of charitable giving, combat
                fraud in the fundraising space, and create a more trustworthy
                environment for <strong>positive impact</strong>.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 italic">
              Together, we&apos;re building a future where every act of
              generosity creates verified, transparent, and meaningful change.
            </p>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default async function Home() {
  const { userId, getToken } = await auth();

  if (!userId || !getToken) {
    return <HomeContent isAuthenticated={false} />;
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

  return <HomeContent isAuthenticated={true} />;
}
