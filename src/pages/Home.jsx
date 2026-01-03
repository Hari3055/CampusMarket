import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SearchBar from "@/components/marketplace/SearchBar";
import CategoryFilter from "@/components/marketplace/CategoryFilter";
import ListingCard from "@/components/marketplace/ListingCard";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [campus, setCampus] = useState("all");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    // Server-side filter for active listings; campus/category are applied client-side.
    queryFn: () => base44.entities.Listing.filter({ status: "active" }, "-created_date"),
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredListings = listings.filter((listing) => {
    const title = listing.title?.toLowerCase() || "";
    const description = listing.description?.toLowerCase() || "";
    const matchesSearch =
      !normalizedSearch ||
      title.includes(normalizedSearch) ||
      description.includes(normalizedSearch);

    const matchesCategory = category === "all" || listing.category === category;
    const matchesCampus = campus === "all" || listing.campus === campus;

    return matchesSearch && matchesCategory && matchesCampus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80')] opacity-10 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 to-transparent" />

        <div className="relative w-full px-6 lg:px-10 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">Student Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              Buy &amp; Sell on Campus
            </h1>
            <p className="text-green-100 text-lg max-w-xl mx-auto">
              Connect with students at Abbotsford and Chilliwack campuses. Textbooks, electronics, furniture and more.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <SearchBar value={search} onChange={setSearch} />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 lg:px-10 py-8">
        {/* Campus Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Campus</span>
          </div>
          <Tabs value={campus} onValueChange={setCampus}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all">All Campuses</TabsTrigger>
              <TabsTrigger value="abbotsford">Abbotsford</TabsTrigger>
              <TabsTrigger value="chilliwack">Chilliwack</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {category === "all"
                ? "All Listings"
                : category.charAt(0).toUpperCase() +
                  category.slice(1).replace("_", " ")}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredListings.length}{" "}
              {filteredListings.length === 1 ? "item" : "items"} available
            </p>
          </div>
          <Link to={createPageUrl("CreateListing")}>
            <Button className="bg-green-700 hover:bg-green-800 rounded-full gap-2 shadow-lg shadow-green-200">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Sell Something</span>
              <span className="sm:hidden">Sell</span>
            </Button>
          </Link>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No listings found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters
            </p>
            <Link to={createPageUrl("CreateListing")}>
              <Button className="bg-green-700 hover:bg-green-800 rounded-full">
                Post the first listing
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredListings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


