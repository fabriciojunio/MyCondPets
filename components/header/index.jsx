"use client";

import "./styles.css";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  FiHome, FiShoppingCart, FiUser, FiLogOut,
  FiBell, FiGrid, FiPackage, FiMenu, FiX, FiSun, FiMoon
} from "react-icons/fi";
import { MdPets } from "react-icons/md";
import { useTheme } from "@/components/theme/ThemeProvider";

export function Header() {
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  const navClass = (href) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `hdr-link${isActive ? " hdr-link--active" : ""}`;
  };
  const navMobileClass = (href) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `hdr-mobile-link${isActive ? " hdr-mobile-link--active" : ""}`;
  };

  // sync cart count from localStorage
  useEffect(() => {
    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("mycondpets_cart") || "[]");
        setCartCount(cart.reduce((acc, i) => acc + i.quantidade, 0));
      } catch { setCartCount(0); }
    };
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("cartUpdated", syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("cartUpdated", syncCart);
    };
  }, []);

  if (status === "loading") {
    return (
      <header className="hdr">
        <div className="hdr-inner">
          <div className="hdr-logo-skeleton" />
        </div>
      </header>
    );
  }

  const perfilCompleto = session?.user?.perfilCompleto;
  const isAdmin = session?.user?.email === "mycondpets@gmail.com";

  return (
    <header className="hdr">
      <div className="hdr-inner">
        {/* Logo */}
        <Link href="/" className="hdr-logo" onClick={() => setMobileOpen(false)}>
          <img
            src="/images/logo/logo_fundo-removebg.png"
            alt="MyCondPets"
            className="hdr-logo-img"
          />
          <span className="hdr-brand">MyCondPets</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hdr-nav">
          <Link href="/" className={navClass("/")}>
            <FiHome size={15} /> Início
          </Link>
          <Link href="/loja" className={`${navClass("/loja")} hdr-link--store`}>
            <FiShoppingCart size={15} /> Loja
          </Link>

          {session && (perfilCompleto || isAdmin) && (
            <>
              <Link href="/noticias" className={navClass("/noticias")}>
                <FiBell size={15} /> Notícias
              </Link>
              <Link href="/perfilDono" className={navClass("/perfilDono")}>
                <FiUser size={15} /> Perfil
              </Link>
              {isAdmin && (
                <>
                  <Link href="/detalhesPets" className={navClass("/detalhesPets")}>
                    <MdPets size={16} /> Pets
                  </Link>
                  <Link href="/telaInicialCond" className={navClass("/telaInicialCond")}>
                    <FiGrid size={15} /> Dashboard
                  </Link>
                </>
              )}
            </>
          )}

          {session && !perfilCompleto && !isAdmin && (
            <span className="hdr-profile-warn">
              <span className="hdr-warn-dot" />
              Complete seu perfil
            </span>
          )}
        </nav>

        {/* Right actions */}
        <div className="hdr-actions">
          {/* Tema claro/escuro */}
          <button className="hdr-theme-toggle" onClick={toggle} title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {/* Cart */}
          <Link href="/carrinho" className="hdr-cart" title="Carrinho">
            <FiShoppingCart size={18} />
            {cartCount > 0 && <span className="hdr-cart-badge">{cartCount}</span>}
          </Link>

          {session ? (
            <button className="hdr-btn hdr-btn--logout" onClick={() => signOut()}>
              <FiLogOut size={15} /> Sair
            </button>
          ) : (
            <Link href="/login" className="hdr-btn hdr-btn--login">
              <FiUser size={15} /> Entrar
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="hdr-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="hdr-mobile">
          <Link href="/" className={navMobileClass("/")} onClick={() => setMobileOpen(false)}>
            <FiHome size={16} /> Início
          </Link>
          <Link href="/loja" className={navMobileClass("/loja")} onClick={() => setMobileOpen(false)}>
            <FiShoppingCart size={16} /> Loja
          </Link>
          {session && (perfilCompleto || isAdmin) && (
            <>
              <Link href="/noticias" className={navMobileClass("/noticias")} onClick={() => setMobileOpen(false)}>
                <FiBell size={16} /> Notícias
              </Link>
              <Link href="/perfilDono" className={navMobileClass("/perfilDono")} onClick={() => setMobileOpen(false)}>
                <FiUser size={16} /> Perfil
              </Link>
              {isAdmin && (
                <>
                  <Link href="/detalhesPets" className={navMobileClass("/detalhesPets")} onClick={() => setMobileOpen(false)}>
                    <MdPets size={16} /> Pets
                  </Link>
                  <Link href="/telaInicialCond" className={navMobileClass("/telaInicialCond")} onClick={() => setMobileOpen(false)}>
                    <FiGrid size={16} /> Dashboard
                  </Link>
                </>
              )}
            </>
          )}
          <Link href="/carrinho" className={navMobileClass("/carrinho")} onClick={() => setMobileOpen(false)}>
            <FiShoppingCart size={16} /> Carrinho {cartCount > 0 && `(${cartCount})`}
          </Link>
          {session ? (
            <button className="hdr-mobile-link hdr-mobile-logout" onClick={() => { signOut(); setMobileOpen(false); }}>
              <FiLogOut size={16} /> Sair
            </button>
          ) : (
            <Link href="/login" className="hdr-mobile-link" onClick={() => setMobileOpen(false)}>
              <FiUser size={16} /> Entrar
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
