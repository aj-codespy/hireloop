import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { HireLoopProvider } from "@/lib/store/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HireLoop",
    template: "%s · HireLoop",
  },
  description: "Structured hiring from application to decision",
  icons: {
    icon: "/brand/hireloop-mark.svg",
    apple: "/brand/hireloop-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <HireLoopProvider>
            {children}
          </HireLoopProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html:
          `(()=>{try{var els=document.querySelectorAll('.reveal');`
          + `if(!('IntersectionObserver'in window)){els.forEach(function(e){e.classList.add('is-visible')});return;}`
          + `var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('is-visible');io.unobserve(en.target);}});},{rootMargin:'0px 0px -10% 0px',threshold:0.08});`
          + `els.forEach(function(e){io.observe(e);});}catch(e){}})();`
        }} />
      </body>
    </html>
  );
}
