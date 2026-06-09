import React from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Topbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 w-full md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-[calc(100vh-4rem)] transition-all">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
