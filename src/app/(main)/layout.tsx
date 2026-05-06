import { Header, Footer, CartDrawer, AnnouncementBar, ContactBar, SplashScreen, CookieConsent } from "@/components/layout";
import { DiscountPopup } from "@/components/discount-popup";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SplashScreen />
      <ContactBar />
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <DiscountPopup />
      <CookieConsent />
    </>
  );
}
