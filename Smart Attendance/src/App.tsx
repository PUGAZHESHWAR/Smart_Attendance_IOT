import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  LayoutDashboard, 
  CheckCircle, 
  Clock,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddStudent from './components/AddStudent';
import VerifyTag from './components/VerifyTag';
import AttendanceMode from './components/AttendanceMode';

type Tab = 'dashboard' | 'add-student' | 'verify' | 'attendance';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ip, setIp] = useState("192.168.43.41"); 

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-student', label: 'Add Student', icon: UserPlus },
    { id: 'verify', label: 'Verify Tag', icon: CheckCircle },
    { id: 'attendance', label: 'Attendance Mode', icon: Clock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard ip={ip}/>;
      case 'add-student':
        return <AddStudent ip={ip}/>;
      case 'verify':
        return <VerifyTag ip={ip}/>;
      case 'attendance':
        return <AttendanceMode ip={ip}/>;
      default:
        return <Dashboard ip={ip}/>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Users className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Smart Attendance</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`ml-4 px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as Tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-base font-medium ${
                      activeTab === item.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;