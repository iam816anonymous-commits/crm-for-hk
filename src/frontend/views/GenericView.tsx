import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GenericViewProps {
  title: string;
  icon: LucideIcon;
}

export default function GenericView({ title, icon: Icon }: GenericViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">System module backed by SQLite WAL database & AI Extraction engine</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
        <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-800">{title} Module Active</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
          Integrated with canonical DB, role permissions, and full audit logs.
        </p>
      </div>
    </div>
  );
}
