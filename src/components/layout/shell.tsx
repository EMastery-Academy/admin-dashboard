/* oxlint-disable react/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { navigation, flatItems, matchActive, type NavModule } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useAdminAuth } from "@/lib/auth/store";
import { useLang, useLangStore, translate, useT } from "@/lib/i18n";
import { MenuIcon, SearchIcon, type AnimatedIconHandle } from "@/components/icons/animated";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/kit";
import { Button as BaseButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CommandPalette, useCommandPalette, usePaletteStore } from "./command-palette";

const COLLAPSED_KEY = "admin.sidebarCollapsed";

function readCollapsed(): boolean {
  return typeof localStorage !== "undefined" && localStorage.getItem(COLLAPSED_KEY) === "1";
}

export function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const lang = useLang();
  const admin = useAdminAuth((state) => state.admin);
  const logout = useAdminAuth((state) => state.logout);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [navOpen, setNavOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const palette = useCommandPalette();

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Any navigation closes the mobile drawer and clears a rail preview.
  useEffect(() => {
    setNavOpen(false);
    setPreviewId(null);
  }, [location.pathname]);

  // Ctrl/⌘ K opens the command palette; Ctrl/⌘ B collapses the sidebar (NavModule).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        usePaletteStore.getState().setOpen(true);
      } else if (key === "b") {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const nav = useMemo(() => navigation.filter((m) => m.disabled || m.sections.length), []);
  const active = useMemo(() => matchActive(location.pathname, flatItems(nav)), [location.pathname, nav]);
  const activeModule = nav.find((m) => m.id === (active?.module.id ?? "")) ?? nav[0];
  const shownModule: NavModule = (previewId && nav.find((m) => m.id === previewId)) || activeModule;

  const crumbs = useMemo(() => {
    if (!active) return [];
    const moduleHref = active.module.sections[0]?.items[0]?.href;
    const out: [string, string][] = [[translate(lang, active.module.title.ar, active.module.title.en), moduleHref]];
    if (active.href !== moduleHref) out.push([translate(lang, active.title.ar, active.title.en), active.href]);
    return out;
  }, [active, lang]);

  return (
    <div className={cn("ma-shell", collapsed && "is-sidebar-collapsed", collapsed && previewId && !navOpen && "is-peek", navOpen && "is-nav-open")}>
      <CommandPalette open={palette.open} onClose={palette.close} />

      <div className="ma-nav-drawer" id="nav-drawer" onMouseLeave={() => setPreviewId(null)}>
        {/* Rail */}
        <nav className="ma-rail" aria-label={t("المجالات", "Domains")}>
          <Link className="ma-rail__logo" to="/dashboard" aria-label={t("ماستري أكاديمي - الرئيسية", "Mastery Academy home")}>
            <svg className="ma-logo" width="44" height="19" aria-hidden="true">
              <use href="#ma-mark" />
            </svg>
          </Link>
          {nav.map((m) => {
            const first = m.sections[0]?.items[0]?.href ?? m.href ?? "/dashboard";
            const current = m.id === activeModule.id;
            return (
              <Link
                key={m.id}
                className={cn("ma-rail__item", m.disabled && "is-disabled", previewId === m.id && m.id !== activeModule.id && "is-previewed")}
                to={m.disabled ? "/dashboard" : `#${first}`}
                onClick={(event) => {
                  event.preventDefault();
                  if (m.disabled) return;
                  if (navOpen) {
                    setPreviewId(m.id);
                    return;
                  }
                  navigate(first);
                }}
                onMouseEnter={() => setPreviewId(m.id)}
                onFocus={() => setPreviewId(m.id)}
                aria-current={current ? "true" : undefined}
                title={translate(useLangStore.getState().lang, m.title.ar, m.title.en)}
              >
                <Icon name={m.icon} />
                <span>{translate(useLangStore.getState().lang, m.title.ar, m.title.en)}</span>
              </Link>
            );
          })}
          <span className="ma-rail__spacer" />
          <IconButton
            icon="panel"
            label={collapsed ? t("توسيع القائمة الجانبية", "Expand sidebar") : t("طيّ القائمة الجانبية", "Collapse sidebar")}
            aria-expanded={!collapsed}
            aria-keyshortcuts="Control+B"
            onClick={() => setCollapsed((v) => !v)}
          />
        </nav>

        {/* Sidebar */}
        <nav className="ma-sidebar" aria-label={translate(useLangStore.getState().lang, shownModule.title.ar, shownModule.title.en)}>
          <Sidebar module={shownModule} activeHref={active?.href} onCollapse={() => setCollapsed(true)} />
        </nav>
      </div>

      <div className="ma-scrim" onClick={() => setNavOpen(false)} />

      <div className="ma-main" onMouseLeave={() => setPreviewId(null)}>
        <header className="ma-topbar">
          <span className="ma-topbar__mobile">
            <IconButton iconNode={<MenuIcon size={22} />} label={t("فتح القائمة", "Open menu")} onClick={() => setNavOpen(true)} />
          </span>
          <nav className="ma-topbar__crumbs ma-breadcrumbs" aria-label={t("مسار التنقل", "Breadcrumb")}>
            <ol>
              {crumbs.map(([label, href], index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={`${label}-${index}`}>
                    {index ? <Icon name="chevronEnd" className="ma-icon-dir" /> : null}
                    {last || !href ? (
                      <span aria-current={last ? "page" : undefined}>{label}</span>
                    ) : (
                      <Link to={href}>{label}</Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <SearchButton label={t("بحث أو أمر", "Search or jump to")} onClick={palette.show} />
          <LangToggle />
          <ThemeToggle />
          <div className="ma-menu">
            <button
              type="button"
              className="ma-btn ma-btn--bare ma-btn--icon"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              aria-label={t("حسابي", "My account")}
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <span className="ma-avatar" style={{ background: "var(--yellow)", margin: 0 }}>
                MA
              </span>
            </button>
            {userMenuOpen ? (
              <div className="ma-menu__pop" role="menu">
                <p className="ma-menu__label">{admin?.email ?? ""}</p>
                <Link className="ma-menu__item" role="menuitem" to="/settings/audit" onClick={() => setUserMenuOpen(false)}>
                  <Icon name="history" />
                  {t("سجل التدقيق", "Audit log")}
                </Link>
                <button
                  type="button"
                  className="ma-menu__item"
                  role="menuitem"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                    navigate("/login");
                  }}
                >
                  <Icon name="logout" />
                  {t("تسجيل الخروج", "Sign out")}
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main id="main" className="ma-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({ module, activeHref, onCollapse }: { module: NavModule; activeHref?: string; onCollapse?: () => void }) {
  const t = useT();
  const lang = useLang();
  const searchIcon = useRef<AnimatedIconHandle>(null);
  const [query, setQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  if (module.disabled) {
    return (
      <>
        <div className="ma-sidebar__head">
          <h2 className="ma-sidebar__title">{translate(lang, module.title.ar, module.title.en)}</h2>
        </div>
        <p className="ma-sidebar__empty">{module.note ? translate(lang, module.note.ar, module.note.en) : ""}</p>
      </>
    );
  }

  const q = query.trim().toLowerCase();

  return (
    <>
      <div className="ma-sidebar__head">
        <h2 className="ma-sidebar__title">{translate(lang, module.title.ar, module.title.en)}</h2>
        {onCollapse ? (
          <IconButton
            icon="panel"
            label={t("طيّ القائمة الجانبية", "Collapse sidebar")}
            aria-expanded
            aria-controls="main"
            aria-keyshortcuts="Control+B"
            onClick={onCollapse}
          />
        ) : null}
      </div>
      <div className="ma-sidebar__search">
        <div className="ma-search">
          <SearchIcon ref={searchIcon} size={18} className="ma-search__icon" />
          <input
            className="ma-input ma-input--search"
            type="search"
            placeholder={t("ابحث في الصفحات", "Search pages")}
            aria-label={t("ابحث في صفحات هذا القسم", "Search pages in this domain")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => searchIcon.current?.startAnimation()}
            onBlur={() => searchIcon.current?.stopAnimation()}
          />
        </div>
      </div>
      <div className="ma-sidebar__nav">
        {module.sections.map((section, si) => {
          const holdsActive = section.items.some((item) => item.href === activeHref);
          const key = `${module.id}:${si}`;
          const open = holdsActive || !collapsedSections[key];
          const items = section.items.filter(
            (item) => !q || translate(lang, item.title.ar, item.title.en).toLowerCase().includes(q) || item.title.en.toLowerCase().includes(q),
          );
          if (q && !items.length) return null;
          return (
            <div className="ma-sidebar__section" key={key}>
              <button
                type="button"
                className="ma-sidebar__section-btn"
                aria-expanded={q ? true : open}
                onClick={() => setCollapsedSections((state) => ({ ...state, [key]: !open }))}
              >
                <Icon name="chevron" />
                {translate(lang, section.title.ar, section.title.en)}
              </button>
              <ul className="ma-sidebar__list" hidden={q ? false : !open}>
                {items.map((item) => (
                  <li key={item.href}>
                    <NavLink className="ma-sidebar__link" to={item.href}>
                      <span>{translate(lang, item.title.ar, item.title.en)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SearchButton({ label, onClick }: { label: string; onClick: () => void }) {
  const icon = useRef<AnimatedIconHandle>(null);
  const play = () => icon.current?.startAnimation();
  const stop = () => icon.current?.stopAnimation();
  return (
    <BaseButton
      variant="soft"
      size="sm"
      onClick={onClick}
      aria-keyshortcuts="Control+K Meta+K"
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
    >
      <SearchIcon ref={icon} size={18} />
      <span className="ma-topbar__desktop">{label}</span>
      <span className="ma-kbd ma-topbar__desktop">Ctrl K</span>
    </BaseButton>
  );
}

function LangToggle() {
  const lang = useLang();
  const setLang = useLangStore((state) => state.setLang);
  return <IconButton icon="globe" label={lang === "ar" ? "English" : "العربية"} onClick={() => setLang(lang === "ar" ? "en" : "ar")} />;
}
