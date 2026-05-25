"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import styles from "./Nav.module.css"

const NAV_LINKS = [
  { href: "/playground", label: "Playground" },
  { href: "/spec", label: "Spec" },
  { href: "/docs", label: "Docs" },
]

// Pages with their own full navigation — hide the global Nav on them
const SELF_NAVD = ["/playground"]

export default function Nav() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("authr-theme") as "dark" | "light" | null
    if (stored === "light") setTheme("light")
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    if (next === "light") {
      document.documentElement.dataset.theme = "light"
    } else {
      delete document.documentElement.dataset.theme
    }
    localStorage.setItem("authr-theme", next)
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"))

  if (SELF_NAVD.includes(pathname)) return null

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>AuthR</span>
            <span className={styles.logoVersion}>v0.1</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.link} ${isActive(l.href) ? styles.active : ""}`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/identient/authr"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </nav>

          <div className={styles.rightActions}>
            <button
              className={styles.themeToggle}
              onClick={toggle}
              title="Toggle theme"
            >
              {theme === "dark" ? "☀ Light" : "◗ Dark"}
            </button>
            {/* Burger — mobile only */}
            <button
              className={styles.burger}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen1 : ""}`} />
              <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen2 : ""}`} />
              <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen3 : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className={styles.mobileMenu}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.mobileLink} ${isActive(l.href) ? styles.mobileLinkActive : ""}`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/identient/authr"
              className={styles.mobileLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
            <div className={styles.mobileDivider} />
            <button className={styles.mobileThemeBtn} onClick={toggle}>
              {theme === "dark" ? "☀ Switch to Light" : "◗ Switch to Dark"}
            </button>
          </nav>
        )}
      </header>

      {/* Tap-outside overlay */}
      {menuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
