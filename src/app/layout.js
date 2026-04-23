import { Inter, Outfit } from "next/font/google";
import { Providers } from "./Providers";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Skill Forge | Advanced Intelligence Assessment",
  description: "Elite protocol for neural skill evaluation and tactical reporting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`antialiased h-full ${inter.variable} ${outfit.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-page-bg text-black">
        <Providers>
          <Toaster position="top-center" richColors />
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
