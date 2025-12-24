import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const conditionLabels = {
  new: { label: "New", color: "bg-emerald-100 text-emerald-700" },
  like_new: { label: "Like New", color: "bg-green-100 text-green-700" },
  good: { label: "Good", color: "bg-blue-100 text-blue-700" },
  fair: { label: "Fair", color: "bg-amber-100 text-amber-700" },
  poor: { label: "Poor", color: "bg-orange-100 text-orange-700" },
};

export default function ListingCard({ listing, index }) {
  const condition = conditionLabels[listing.condition] || conditionLabels.good;
  const placeholderImage =
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={createPageUrl("ListingDetails") + `?id=${listing.id}`}>
        <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-100 transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={listing.images?.[0] || placeholderImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {listing.status === "sold" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SOLD</span>
              </div>
            )}
            <Badge
              className={`absolute top-2 right-2 ${condition.color} border-0 shadow-sm`}
            >
              {condition.label}
            </Badge>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors">
                {listing.title}
              </h3>
              <span className="text-lg font-bold text-green-700 flex-shrink-0">
                ${listing.price}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-xs text-gray-500">
              {listing.campus && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {listing.campus === "abbotsford"
                      ? "Abbotsford"
                      : "Chilliwack"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                {listing.created_date && (
                  <span>{format(new Date(listing.created_date), "MMM d")}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


