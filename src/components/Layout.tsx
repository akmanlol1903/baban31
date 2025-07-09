import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onGameSelect: (gameId: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, searchTerm, setSearchTerm, onGameSelect }) => {
  // Ana sayfa dışındaki sayfalar için ortalanmış ve kenar boşluklu bir yapı kullanılıyor.
  const mainContentClass = currentView === 'home'
    ? "" // Ana sayfa için ekstra padding veya margin yok
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header 
        onViewChange={onViewChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onGameSelect={onGameSelect}
      />
      {/* Header'ın arkasında kalmaması için içeriğe üstten boşluk ver */}
      <main className={mainContentClass} style={{ paddingTop: currentView !== 'home' ? '96px' : '0' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;