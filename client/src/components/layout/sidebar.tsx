import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Brain, X, Menu } from "lucide-react";
import { NAVIGATION_ITEMS, USER_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || 'student');

  const filteredNavItems = NAVIGATION_ITEMS.filter(item => 
    item.roles.includes('all') || item.roles.includes(selectedRole)
  );

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    // In a real app, you might want to update the user's role or simulate different views
  };

  const currentRole = USER_ROLES.find(role => role.value === selectedRole);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-lg border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        "hidden lg:block"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-white" />
              <h1 className="text-xl font-bold text-white">EduMind AI</h1>
            </div>
          )}
          {isCollapsed && (
            <Brain className="h-8 w-8 text-white mx-auto" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 lg:hidden"
            onClick={() => setIsCollapsed(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Role Selector */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-100">
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map(role => (
                  <SelectItem key={role.id} value={role.value}>
                    <span className="mr-2">{role.icon}</span>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavItems.map(item => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-colors duration-200",
                    isActive 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
                    isCollapsed && "px-2"
                  )}
                >
                  <i className={cn(item.icon, "w-5 h-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {currentRole?.name}
                </p>
              </div>
            </div>
        
          </div>
        )}

        {/* Collapse Toggle */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50"
            onClick={() => setIsCollapsed(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden">
        {/* Mobile sidebar would go here - simplified for now */}
      </div>

      {/* Expand Button for Collapsed Sidebar */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="fixed left-4 top-20 z-50 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 lg:block hidden"
          onClick={() => setIsCollapsed(false)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
