import "./globals.css";
import { Header } from '../components/header'
import { Footer } from "@/components/footer";
import AuthProvider from "./authProvider/auth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1B4F72" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Script síncrono — aplica o tema ANTES de qualquer renderização, evitando flash branco */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('mycondpets_theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e) {
              document.documentElement.setAttribute('data-theme', 'dark');
            }
          })();
        `}} />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
          <Header />

          <script src="https://kit.fontawesome.com/58c0554857.js" crossOrigin="anonymous"></script>

          {children}
          <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}