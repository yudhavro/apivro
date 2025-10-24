import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DevicesPage } from './pages/DevicesPage';
import { APIKeysPage } from './pages/APIKeysPage';
import { APIPlaygroundPage } from './pages/APIPlaygroundPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WebhookLogsPage } from './pages/WebhookLogsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/devices"
        element={
          <PrivateRoute>
            <DevicesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/api-keys"
        element={
          <PrivateRoute>
            <APIKeysPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/api-playground"
        element={
          <PrivateRoute>
            <APIPlaygroundPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/documentation"
        element={
          <PrivateRoute>
            <DocumentationPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <PrivateRoute>
            <SubscriptionPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/subscription/history"
        element={
          <PrivateRoute>
            <PaymentHistoryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <PrivateRoute>
            <StatisticsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/webhook-logs"
        element={
          <PrivateRoute>
            <WebhookLogsPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
