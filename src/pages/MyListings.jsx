import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreVertical,
  Eye,
  CheckCircle,
  Trash2,
  Package,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useUfvStudentUser } from "@/hooks/useUfvStudentUser";

const statusConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  sold: { label: "Sold", color: "bg-blue-100 text-blue-700" },
  removed: { label: "Removed", color: "bg-gray-100 text-gray-700" },
};

export default function MyListings() {
  const { user, loading, isUfvStudent } = useUfvStudentUser();
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", user?.email],
    queryFn: () =>
      base44.entities.Listing.filter(
        { seller_email: user.email },
        "-created_date"
      ),
    enabled: !!user?.email && isUfvStudent,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Listing.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      setDeleteId(null);
    },
  });

  const markAsSold = (id) =>
    updateMutation.mutate({ id, data: { status: "sold" } });
  const reactivate = (id) =>
    updateMutation.mutate({ id, data: { status: "active" } });

  if (loading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!user || !isUfvStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full px-6 lg:px-10 py-8">
          <Link to={createPageUrl("Home")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTitle className="text-blue-900 font-semibold mb-2">
              Sign in with your UFV email
            </AlertTitle>
            <AlertDescription className="text-blue-800 space-y-2">
              <p>
                You need to be signed in with your{" "}
                <strong>@student.ufv.ca</strong> email to manage your listings.
              </p>
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="bg-green-700 hover:bg-green-800 mt-2"
              >
                Sign In
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link to={createPageUrl("Home")}>
              <Button
                variant="ghost"
                className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500">Manage your items for sale</p>
          </div>
          <Link to={createPageUrl("CreateListing")}>
            <Button className="bg-green-700 hover:bg-green-800 rounded-full gap-2 shadow-lg shadow-green-200">
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No listings yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start selling by creating your first listing
            </p>
            <Link to={createPageUrl("CreateListing")}>
              <Button className="bg-green-700 hover:bg-green-800 rounded-full">
                Create your first listing
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {listings.map((listing, index) => {
                const status = statusConfig[listing.status] || statusConfig.active;
                const placeholderImage =
                  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&q=80";

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex gap-4">
                          <Link
                            to={
                              createPageUrl("ListingDetails") +
                              `?id=${listing.id}`
                            }
                          >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={listing.images?.[0] || placeholderImage}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link
                                  to={
                                    createPageUrl("ListingDetails") +
                                    `?id=${listing.id}`
                                  }
                                >
                                  <h3 className="font-semibold text-gray-900 truncate hover:text-green-700 transition-colors">
                                    {listing.title}
                                  </h3>
                                </Link>
                                <p className="text-lg font-bold text-green-700 mt-0.5">
                                  ${listing.price}
                                </p>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      to={
                                        createPageUrl("ListingDetails") +
                                        `?id=${listing.id}`
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View Listing
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {listing.status === "active" && (
                                    <DropdownMenuItem
                                      onClick={() => markAsSold(listing.id)}
                                      className="gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Mark as Sold
                                    </DropdownMenuItem>
                                  )}
                                  {listing.status === "sold" && (
                                    <DropdownMenuItem
                                      onClick={() => reactivate(listing.id)}
                                      className="gap-2"
                                    >
                                      <Package className="h-4 w-4" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => setDeleteId(listing.id)}
                                    className="text-red-600 gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              <Badge className={`${status.color} border-0`}>
                                {status.label}
                              </Badge>
                              {listing.created_date && (
                                <span>
                                  Posted{" "}
                                  {format(new Date(listing.created_date), "MMM d")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


