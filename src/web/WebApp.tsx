import { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toaster } from 'sonner';
import { AppStateScreen } from '@/components/custom/AppStateScreen';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const WebLoginPage = lazy(() => import('./pages/WebLoginPage'));
const PartnerPage = lazy(() => import('./pages/PartnerPage'));
const WebAppPage = lazy(() => import('./pages/WebAppPage'));
const MobilAppPage = lazy(() => import('./pages/MobilAppPage'));
const SamvaerPage = lazy(() => import('./pages/SamvaerPage'));
const OpgaverPage = lazy(() => import('./pages/OpgaverPage'));
const MadHjemPage = lazy(() => import('./pages/MadHjemPage'));
const KommunikationPage = lazy(() => import('./pages/KommunikationPage'));
const UdgifterPage = lazy(() => import('./pages/UdgifterPage'));
const KalenderPage = lazy(() => import('./pages/KalenderPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <AppStateScreen state="loading" />
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
  const isLogin = route === '#login';
  const isPartner = route === '#partner';
  const isWebApp = route === '#webapp';
  const isMobilApp = route === '#mobilapp';
  const isSamvaer = route === '#samvaer';
  const isOpgaver = route === '#opgaver';
  const isMadHjem = route === '#madhjem';
  const isKommunikation = route === '#kommunikation';
  const isUdgifter = route === '#udgifter';
  const isKalender = route === '#kalender';
  const hideChrome = isAdmin || isLogin;

  const renderPage = () => {
    if (isLogin) return <WebLoginPage />;
    if (isAdmin) return <AdminPage />;
    if (isPrivacy) return <PrivacyPage />;
    if (isAbout) return <AboutPage />;
    if (isContact) return <ContactPage />;
    if (isTerms) return <TermsPage />;
    if (isPartner) return <PartnerPage />;
    if (isWebApp) return <WebAppPage />;
    if (isMobilApp) return <MobilAppPage />;
    if (isSamvaer) return <SamvaerPage />;
    if (isOpgaver) return <OpgaverPage />;
    if (isMadHjem) return <MadHjemPage />;
    if (isKommunikation) return <KommunikationPage />;
    if (isUdgifter) return <UdgifterPage />;
    if (isKalender) return <KalenderPage />;
    return <LandingPage />;
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col">
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
