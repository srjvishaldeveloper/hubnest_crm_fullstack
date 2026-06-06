'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import TrustSection from '../components/landing/TrustSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import StatsBar from '../components/landing/StatsBar';
import AIInsightsSection from '../components/landing/AIInsightsSection';
import HowItWorks from '../components/landing/HowItWorks';
import Testimonials from '../components/landing/Testimonials';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

const ROLE_DASHBOARDS: Record<string, string> = {
  'Super Admin': '/super-admin/dashboard',
  'Admin': '/admin/dashboard',
  'Marketing Head': '/marketing/dashboard',
  'Marketing Executive': '/marketing/dashboard',
  'Sales Manager': '/sales-manager/dashboard',
  'Sales Executive': '/sales-executive/dashboard',
  'Support Manager': '/support/dashboard',
  'Support Agent': '/support/dashboard',
  'Finance Executive': '/finance/dashboard',
};

export default function LandingPage() {
  const router = useRouter();
  // Start as true to avoid a flash of the landing page for logged-in users
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Only redirect if the token is still valid
        if (payload.exp * 1000 > Date.now()) {
          const dashboard = ROLE_DASHBOARDS[payload.role as string];
          if (dashboard) {
            router.replace(dashboard);
            return;
          }
        }
      } catch {
        // Malformed token — fall through to landing page
      }
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <StatsBar />
      <AIInsightsSection />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
