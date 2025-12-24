import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  User,
  Flag,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useUfvStudentUser } from "@/hooks/useUfvStudentUser";

const conditionLabels = {
  new: { label: "New", color: "bg-emerald-100 text-emerald-700" },
  like_new: { label: "Like New", color: "bg-green-100 text-green-700" },
  good: { label: "Good", color: "bg-blue-100 text-blue-700" },
  fair: { label: "Fair", color: "bg-amber-100 text-amber-700" },
  poor: { label: "Poor", color: "bg-orange-100 text-orange-700" },
};

const categoryLabels = {
  textbooks: "Textbooks",
  electronics: "Electronics",
  furniture: "Furniture",
  clothing: "Clothing",
  tickets: "Tickets",
  sports: "Sports Equipment",
  kitchen: "Kitchen",
  decor: "Decor",
  other: "Other",
};

export default function ListingDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get("id");
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);

  const { user, isUfvStudent, isVerified } = useUfvStudentUser();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: async () => {
      const listings = await base44.entities.Listing.filter({ id: listingId });
      return listings[0];
    },
    enabled: !!listingId,
  });

  const placeholderImage =
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80";
  const images =
    listing?.images?.length > 0 ? listing.images : [placeholderImage];
  const condition = conditionLabels[listing?.condition] || conditionLabels.good;

  const nextImage = () =>
    setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const handleContactSeller = () => {
    if (!user || !isUfvStudent) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!isVerified) {
      // Optionally show a toast or inline message instead of navigation
      return;
    }
    if (listing?.seller_email === user.email) {
      return; // Can't message yourself
    }
    navigate(
      createPageUrl("Conversation") +
        `?listing_id=${listing.id}&other=${encodeURIComponent(
          listing.seller_email
        )}`
    );
  };

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const handleReport = async () => {
    if (!user || !isUfvStudent) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const trimmed = reportReason.trim();
    if (!trimmed) return;

    setReportSubmitting(true);
    try {
      await base44.entities.Report.create({
        listing_id: listing.id,
        reporter_email: user.email,
        reason: trimmed.slice(0, 500),
      });
      setReportSent(true);
      setReportReason("");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
          <Link to={createPageUrl("Home")}>
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Link to={createPageUrl("Home")}>
          <Button
            variant="ghost"
            className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={images[currentImage]}
                  alt={listing.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {listing.status === "sold" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">SOLD</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImage
                        ? "border-indigo-500 ring-2 ring-indigo-200"
                        : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${condition.color} border-0`}>
                  {condition.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600"
                >
                  {categoryLabels[listing.category] || listing.category}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {listing.title}
            </h1>

            <p className="text-3xl font-bold text-green-700 mb-6">
              ${listing.price}
            </p>

            {listing.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
              {listing.campus && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    {listing.campus === "abbotsford"
                      ? "Abbotsford Campus"
                      : "Chilliwack Campus"}
                  </span>
                </div>
              )}
              {listing.location && (
                <div className="flex items-center gap-1.5">
                  <span>• {listing.location}</span>
                </div>
              )}
              {listing.created_date && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    Listed{" "}
                    {format(new Date(listing.created_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Safety tips */}
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-900">
              <p className="font-semibold mb-1">Safety tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Meet on campus in busy public spaces.</li>
                <li>Avoid sharing your home address or sensitive information.</li>
                <li>Inspect items in person before paying.</li>
              </ul>
            </div>

            {/* Seller Card */}
            <Card className="border-0 shadow-lg shadow-gray-100/50 mt-auto">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 bg-indigo-100">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium">
                      {listing.seller_name?.charAt(0).toUpperCase() || (
                        <User className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {listing.seller_name || "Anonymous Seller"}
                    </h3>
                    <p className="text-sm text-gray-500">Seller</p>
                  </div>
                </div>

                {listing.status === "active" &&
                  listing.seller_email &&
                  listing.seller_email !== user?.email && (
                    <Button
                      onClick={handleContactSeller}
                      className="w-full bg-green-700 hover:bg-green-800 gap-2 h-12 text-base rounded-xl"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message Seller
                    </Button>
                  )}
                {listing.seller_email === user?.email && (
                  <p className="text-center text-sm text-gray-500 py-3">
                    This is your listing
                  </p>
                )}

                {/* Report listing */}
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen((v) => !v)}
                    className="text-xs text-red-600 flex items-center gap-1 hover:underline"
                  >
                    <Flag className="h-3 w-3" />
                    Report this listing
                  </button>

                  {reportOpen && (
                    <div className="border rounded-lg p-3 bg-red-50/40">
                      {!reportSent ? (
                        <>
                          <p className="text-xs text-gray-600 mb-2">
                            Use this only for scams, abusive content, or safety
                            concerns. Reports may be reviewed by admins.
                          </p>
                          <Textarea
                            rows={3}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Explain what seems wrong or unsafe..."
                            className="text-xs mb-2"
                          />
                          <Button
                            size="sm"
                            disabled={
                              reportSubmitting || !reportReason.trim()
                            }
                            onClick={handleReport}
                            className="bg-red-600 hover:bg-red-700 text-xs h-8 px-3"
                          >
                            {reportSubmitting ? "Sending..." : "Submit report"}
                          </Button>
                        </>
                      ) : (
                        <p className="text-xs text-green-700">
                          Thanks. Your report has been submitted.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


