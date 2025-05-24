import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Menu, Search, Bell, Sun, Moon, Settings } from "lucide-react";

export default function TopBar() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-6 relative z-10">
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="sm" className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-auto lg:mx-0 lg:max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search lessons, quizzes, students..."
            className="w-full pl-10 pr-4 py-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center p-0">
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Avatar */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
