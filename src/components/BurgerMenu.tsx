import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Popover } from "radix-ui";
import "~/styles/components/BurgerMenu.css";

type Item = {
  to: string;
  label: string;
  exact?: boolean;
};

const ITEMS: Item[] = [
  { to: "/", label: "Home", exact: true },
  { to: "/pokemon", label: "Pokémon" },
  { to: "/berries", label: "Berries" },
  { to: "/items", label: "Items" },
  { to: "/locations", label: "Locations" },
  { to: "/moves", label: "Moves" },
  { to: "/generations", label: "Generations" },
  { to: "/search", label: "Search" },
];

export function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close whenever the route changes — clicking a link inside the menu should
  // close it even if the button focus stays put.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          ref={buttonRef}
          type="button"
          className="burger-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span className="burger-btn__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="burger-menu"
          align="start"
          sideOffset={8}
          collisionPadding={10}
        >
          <nav aria-label="Primary">
            <ul className="burger-menu__list">
              {ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeProps={{ className: "burger-menu__link burger-menu__link--active" }}
                    activeOptions={{ exact: item.exact ?? false }}
                    className="burger-menu__link"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Popover.Arrow className="burger-menu__arrow" width={14} height={8} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
