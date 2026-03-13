import { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toaster } from 'sonner';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f58a2d] border-t-transparent" />
    </div>
  );
}

export function WebApp() {
  const [route, setRoute] = useState(window.location.hash || '#');

  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const isAdmin = route === '#admin';
  const isPrivacy = route === '#privatlivspolitik';
  const isAbout = route === '#om';
  const isContact = route === '#kontakt';
  const isTerms = route === '#vilkar';
  const hideChrome = isAdmin;

  const renderPage = () => {
    if (isAdmin) return <AdminPage />;
    if (isPrivacy) return <PrivacyPage />;
    if (isAbout) return <AboutPage />;
    if (isContact) return <ContactPage />;
    if (isTerms) return <TermsPage />;
    return <LandingPage />;
  };

  return (
    <div className="min-h-screen bg-[#f2f1ed] flex flex-col">
      {!hideChrome && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          {renderPage()}
        </Suspense>
      </main>
      {!hideChrome && <Footer />}
      <Toaster position="top-center" />
    </div>
  );
}
