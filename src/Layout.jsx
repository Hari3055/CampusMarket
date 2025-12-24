import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useUfvStudentUser } from "@/hooks/useUfvStudentUser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  Plus,
  Package,
  MessageCircle,
  LogOut,
} from "lucide-react";

export default function Layout({ children }) {
  const { user } = useUfvStudentUser();

  const handleSignOut = () => {
    base44.auth.logout();
    // Let the app/router reset user state as needed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
              <div className="p-2 bg-green-700 rounded-xl">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Campus Market
              </span>
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user && (
                <Link to={createPageUrl("Messages")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Messages</span>
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("CreateListing")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sell</span>
                </Button>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9 bg-indigo-100">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium text-sm">
                          {user.full_name?.charAt(0).toUpperCase() ||
                            user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={createPageUrl("Messages")}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={createPageUrl("MyListings")}
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        My Listings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600 gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-green-700 hover:bg-green-800 rounded-full"
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}


