import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import {
  LayoutDashboard,
  Smartphone,
  Key,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Activity,
  ChevronRight,
  User,
  Code2,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Play,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    { name: t.navigation.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.navigation.devices, href: '/devices', icon: Smartphone },
    { name: t.navigation.apiKeys, href: '/api-keys', icon: Key },
    { name: 'Webhook Logs', href: '/webhook-logs', icon: Activity },
    { name: 'API Playground', href: '/api-playground', icon: Play },
    { name: t.navigation.subscription, href: '/subscription', icon: CreditCard },
    { name: t.navigation.documentation, href: '/documentation', icon: BookOpen },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-12 px-4 border-b border-r border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <Code2 className="w-5 h-5 text-slate-900 flex-shrink-0" />
              {!sidebarCollapsed && <h1 className="text-base font-bold text-slate-900 truncate">APIvro</h1>}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto border-r border-slate-200">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-r border-slate-200 space-y-1">
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/settings')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={sidebarCollapsed ? t.navigation.settings : undefined}
            >
              <Settings className={`w-5 h-5 flex-shrink-0 ${isActive('/settings') ? 'text-blue-600' : 'text-slate-400'}`} />
              {!sidebarCollapsed && <span>{t.navigation.settings}</span>}
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200"
              title={sidebarCollapsed ? t.auth.signOut : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{t.auth.signOut}</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'pl-16' : 'pl-56'
      }`}>
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-12 px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 text-sm">
              {sidebarCollapsed && (
                <>
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Expand sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                  <div className="h-5 w-px bg-slate-200" />
                </>
              )}
              <Link to="/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-medium">
                {navigation.find((item) => isActive(item.href))?.name || t.navigation.dashboard}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Toggle - Clean Style */}
              <div className="flex items-center gap-1" title="Switch Language">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    language === 'en'
                      ? 'bg-slate-100 text-blue-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="English"
                >
                  🇺🇸 EN
                </button>
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    language === 'id'
                      ? 'bg-slate-100 text-blue-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Indonesia"
                >
                  🇮🇩 ID
                </button>
              </div>

              {/* Notification */}
              <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-700" />
                  </div>
                )}
                <span className="text-sm font-medium text-slate-900">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
