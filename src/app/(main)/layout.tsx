import { Header, Footer, CartDrawer, AnnouncementBar } from "@/components/layout";
import { DiscountPopup } from "@/components/discount-popup";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <DiscountPopup />
    </>
  );
}
