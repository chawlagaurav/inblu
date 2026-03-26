import { Header, Footer, CartDrawer } from "@/components/layout";
import { DiscountPopup } from "@/components/discount-popup";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <DiscountPopup />
    </>
  );
}
