import type { ComponentChildren } from "preact";
import { useOnline } from "../data/hooks.ts";
import { href, type Route } from "../router.ts";
import { Icon, type IconName } from "./Icon.tsx";

const tabs: { route: Route; label: string; icon: IconName }[] = [
  { route: "stock", label: "Mon stock", icon: "box" },
  { route: "recettes", label: "Recettes", icon: "book" },
  { route: "bilan", label: "Mon bilan", icon: "badge" },
];

export function AppHeader({ subtitle, back }: { subtitle: string; back?: Route }) {
  const online = useOnline();
  return (
    <header class="app-header">
      {back ? (
        <a class="icon-button" href={href(back)} aria-label="Retour">
          <Icon name="arrowLeft" size={24} />
        </a>
      ) : (
        <span class="app-logo">
          <Icon name="fridge" size={22} />
        </span>
      )}
      <div class="app-title">
        <span class="app-name">FrigoMalin</span>
        <span class="app-subtitle">{subtitle}</span>
      </div>
      <span class={`net-chip ${online ? "is-online" : "is-offline"}`} role="status">
        <Icon name={online ? "checkCircle" : "cloudOff"} size={16} />
        {online ? "En ligne" : "Hors ligne"}
      </span>
    </header>
  );
}

export function BottomNav({ current }: { current: Route }) {
  return (
    <nav class="bottom-nav" aria-label="Navigation principale">
      {tabs.map((tab) => (
        <a
          key={tab.route}
          href={href(tab.route)}
          class="bottom-nav-link"
          aria-current={tab.route === current ? "page" : undefined}
        >
          <Icon name={tab.icon} size={24} />
          {tab.label}
        </a>
      ))}
    </nav>
  );
}

export function Notice({
  tone,
  icon,
  children,
}: {
  tone: "info" | "success" | "warning" | "danger";
  icon: IconName;
  children: ComponentChildren;
}) {
  return (
    <div class={`notice notice-${tone}`}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  );
}
