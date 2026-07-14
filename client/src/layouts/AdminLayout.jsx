import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);

  // Auto-collapse sidebar on mobile when resizing or navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className={`admin-layout-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        setSidebarCollapsed={setSidebarCollapsed}
      />
      
      {/* Mobile Drawer Overlay */}
      {!sidebarCollapsed && window.innerWidth <= 768 && (
        <div 
          className="admin-sidebar-overlay" 
          onClick={() => setSidebarCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}

      <div className="admin-main-wrapper">
        <AdminNavbar toggleSidebar={toggleSidebar} />
        <div className="admin-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
