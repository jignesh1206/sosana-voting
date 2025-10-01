'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Icons (we'll use simple text for now, can add proper icons later)
const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="w-6 h-6 flex items-center justify-center text-lg">{children}</span>
);

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Rounds', href: '/admin/rounds', icon: '⏰' },
  { name: 'Nominations', href: '/admin/nominations', icon: '🏆' },
  { name: 'Votes', href: '/admin/votes', icon: '🗳️' },
  { name: 'Results', href: '/admin/results', icon: '🏅' },
  { name: 'Vesting', href: '/admin/vesting', icon: '🔒' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full  flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-10 lg:w-1/5 w-[75%]  cosmic-card transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-card-border">
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-foreground/60 hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-xl font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-card-highlight text-accent border-r-2 border-accent'
                      : 'text-foreground/80 hover:bg-card-highlight hover:text-accent'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon>{item.icon}</Icon>
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="w-full md:w-4/5 ">
        {/* Top bar */}
        <div className="sticky top-0  cosmic-card border-b border-card-border">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-foreground/60 hover:text-foreground"
            >
              ☰
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground/60">Admin Dashboard</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 