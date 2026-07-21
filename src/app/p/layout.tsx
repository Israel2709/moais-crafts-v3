import { SellerShell } from "@/components/catalog/SellerShell";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerShell>{children}</SellerShell>;
}
