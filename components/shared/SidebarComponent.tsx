"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ArrowLeftRight,
  CreditCard,
  FileText,
  Wallet,
  Sparkles,
  PiggyBank,
  BarChart3,
  TrendingUp,
  HelpCircle,
  Settings,
  User,
  Zap,
} from "lucide-react";

const generalLinks = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid, active: true },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
    active: true
  },
  { name: "Payment", href: "/dashboard/payment", icon: CreditCard, active: false },
  { name: "Report", href: "/dashboard/report", icon: FileText, active: false },
  { name: "Budgets", href: "/dashboard/budgets", icon: Wallet, active: false },
];

const toolLinks = [
  { name: "AI Insights", href: "/dashboard/ai", icon: Sparkles, active: false },
  { name: "Savings Planner", href: "/dashboard/savings", icon: PiggyBank, active: false },
  { name: "Expense Tracker", href: "/dashboard/expenses", icon: BarChart3, active: false },
  {
    name: "Investment Tracker",
    href: "/dashboard/investments",
    icon: TrendingUp,
    active: false
  },
];

const bottomLinks = [
  { name: "Help Center", href: "/dashboard/help", icon: HelpCircle, active: false },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, active: true },
  { name: "Profile", href: "/dashboard/profile", icon: User, active: true },
];

const SidebarComponent = () => {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return path === "/dashboard";
    return path.startsWith(href);
  };

  const NavLink = ({
    link,
  }: {
    link: { name: string; href: string; icon: React.ElementType, active: boolean };
  }) => {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <Link
        href={link.href}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${link.active === false ? "cursor-not-allowed pointer-events-none text-zinc-400/50" : ""} ${
          active
            ? "bg-[#baff29] text-black"
            : "text-zinc-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
        <span>{link.name}</span>
      </Link>
    );
  };

  return (
    <aside className="w-[220px] shrink-0 h-screen bg-[#111111] text-white flex flex-col py-5 px-3 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-7">
        <div className="w-8 h-8 rounded-lg bg-[#baff29] flex items-center justify-center shrink-0">
          <Zap size={16} className="text-black" fill="black" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white">
          PaySim
        </span>
      </div>

      {/* General */}
      <div className="mb-5">
        <span className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          General
        </span>
        <nav className="mt-2 flex flex-col gap-0.5">
          {generalLinks.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
        </nav>
      </div>

      {/* Tools */}
      <div className="mb-5">
        <span className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Tools
        </span>
        <nav className="mt-2 flex flex-col gap-0.5">
          {toolLinks.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="border-t border-white/10 mb-3" />

      {/* Bottom links */}
      <nav className="flex flex-col gap-0.5">
        {bottomLinks.map((link) => (
          <NavLink key={link.href} link={link} />
        ))}
      </nav>
    </aside>
  );
};

export default SidebarComponent;
