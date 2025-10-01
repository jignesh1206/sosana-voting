"use client";

import React from 'react';
import Link from 'next/link';

export type AdminNavItem = {
  id: string;
  label: string;
  icon?: string;
  href?: string;
};

type AdminNavProps = {
  items: AdminNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  title?: string;
};

const AdminNav: React.FC<AdminNavProps> = ({ items, activeId, onChange, title = 'Admin Menu' }) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b text-sm font-semibold text-gray-700">
        {title}
      </div>
      <nav className="p-2">
        {items.map((item) => (
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className={`block px-3 py-2 rounded-md mb-1 flex items-center gap-2 text-gray-700 hover:bg-gray-50`}
            >
              {item.icon ? <span>{item.icon}</span> : null}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ) : (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center gap-2 ${
                activeId === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon ? <span>{item.icon}</span> : null}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        ))}
      </nav>
    </div>
  );
};

export default AdminNav;


