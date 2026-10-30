import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import ToastContainer from './components/ToastContainer';

import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Summarizer from './pages/Summarizer';
import Quiz from './pages/Quiz';
import Search from './pages/Search';
import Planner from './pages/Planner';
import Progress from './pages/Progress';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

function AppContent() {
  const { activePage } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'documents':
        return <Documents />;
      case 'chat':
        return <Chat />;
      case 'summarizer':
        return <Summarizer />;
      case 'quiz':
        return <Quiz />;
      case 'search':
        return <Search />;
      case 'planner':
        return <Planner />;
      case 'progress':
        return <Progress />;
      case 'notes':
        return <Notes />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <main style={{ flex: 1 }}>{renderPage()}</main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
