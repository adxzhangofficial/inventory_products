import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import CatalogPage from "@/pages/catalog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

type User = {
  username: string;
  role: string;
};

type AppState = 'loading' | 'login' | 'home' | 'admin' | 'catalog';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setAppState('home');
        } else {
          setAppState('login');
        }
      } catch (error) {
        setAppState('login');
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setAppState('home');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setAppState('login');
  };

  const handleNavigate = (page: 'admin' | 'catalog') => {
    setAppState(page);
  };

  const handleBackToHome = () => {
    setAppState('home');
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        
        {appState === 'login' && (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )}
        
        {appState === 'home' && user && (
          <HomePage 
            user={user} 
            onNavigate={handleNavigate} 
            onLogout={handleLogout} 
          />
        )}
        
        {appState === 'admin' && user && (
          <div>
            <div className="bg-white shadow-sm border-b p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-semibold">Admin Panel</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={handleBackToHome}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Back to Home
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
            <Dashboard />
          </div>
        )}
        
        {appState === 'catalog' && (
          <CatalogPage onBack={handleBackToHome} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
