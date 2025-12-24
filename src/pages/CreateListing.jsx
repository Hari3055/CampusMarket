import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Tag, AlertCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import ListingForm from "@/components/marketplace/ListingForm";
import { useUfvStudentUser } from "@/hooks/useUfvStudentUser";

export default function CreateListing() {
  const navigate = useNavigate();
  const { user, loading, isUfvStudent, isVerified } = useUfvStudentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link to={createPageUrl("Home")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to listings
            </Button>
          </Link>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold mb-2">
              Sign In Required
            </AlertTitle>
            <AlertDescription className="text-blue-800 space-y-3">
              <p>
                You need to sign in with your UFV student email to create a
                listing.
              </p>
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="bg-green-700 hover:bg-green-800"
              >
                Sign In with UFV Email
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Logged in but not UFV student email
  if (!isUfvStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link to={createPageUrl("Home")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to listings
            </Button>
          </Link>

          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-900 font-semibold mb-2">
              UFV Student Email Required
            </AlertTitle>
            <AlertDescription className="text-red-800 space-y-3">
              <p>
                Only UFV students can create listings. Please sign out and
                register using your <strong>@student.ufv.ca</strong> email
                address.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => base44.auth.logout()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sign Out
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">
                  Don&apos;t have your UFV student email yet?
                </p>
                <p className="text-blue-700">
                  Contact UFV IT Services to activate your student email
                  account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UFV email but not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link to={createPageUrl("Home")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to listings
            </Button>
          </Link>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-900 font-semibold mb-2">
              Verify your UFV email
            </AlertTitle>
            <AlertDescription className="text-amber-800 space-y-3">
              <p>
                Your UFV student email must be verified before you can post
                listings or message other students.
              </p>
              <p>
                Check your inbox for a verification email from the login
                provider, click the link, then sign out and sign back in.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data) => {
    if (!user || !isUfvStudent || !isVerified) return;
    setIsSubmitting(true);

    try {
      await base44.entities.Listing.create({
        ...data,
        seller_name: user.full_name || "Anonymous",
        seller_email: user.email,
        status: "active",
      });

      navigate(createPageUrl("MyListings"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Home")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to listings
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Tag className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Listing
              </h1>
              <p className="text-gray-500">Sell something to fellow students</p>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl shadow-gray-100/50">
            <CardContent className="p-6 sm:p-8">
              <ListingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


