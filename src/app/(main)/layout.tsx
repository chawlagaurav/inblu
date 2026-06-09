import { CartDrawer, SplashScreen, CookieConsent } from "@/components/layout";
import { StoreChrome } from "@/components/layout/store-chrome";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SplashScreen />
      <StoreChrome>{children}</StoreChrome>
      <CartDrawer />
      <CookieConsent />
    </>
  );
}
