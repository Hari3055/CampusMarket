import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useUfvStudentUser } from "@/hooks/useUfvStudentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { user, loading, isUfvStudent, isVerified } = useUfvStudentUser();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["messages", user?.email],
    enabled: !!user?.email && isUfvStudent && isVerified,
    queryFn: async () => {
      // Fetch messages where the user is either sender or receiver
      const sent = await base44.entities.Message.filter(
        { sender_email: user.email },
        "-created_date"
      );
      const received = await base44.entities.Message.filter(
        { receiver_email: user.email },
        "-created_date"
      );

      const all = [...sent, ...received];

      // Group by listing + other participant
      const map = new Map();

      all.forEach((msg) => {
        const otherEmail =
          msg.sender_email === user.email
            ? msg.receiver_email
            : msg.sender_email;
        const key = `${msg.listing_id}|${otherEmail}`;
        const existing = map.get(key);
        if (!existing || new Date(msg.created_date) > new Date(existing.created_date)) {
          map.set(key, { ...msg, other_email: otherEmail });
        }
      });

      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.created_date || 0).getTime() -
          new Date(a.created_date || 0).getTime()
      );
    },
  });

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
                Only verified UFV students can view and send messages. Please
                sign in with your <strong>@student.ufv.ca</strong> email.
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

  if (!isVerified) {
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
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTitle className="text-amber-900 font-semibold mb-2">
              Verify your UFV email
            </AlertTitle>
            <AlertDescription className="text-amber-800 space-y-2">
              <p>
                To protect students from spam and abuse, only verified UFV
                emails can send and receive messages.
              </p>
              <p>
                Check your inbox for a verification email, complete the process,
                then sign out and sign in again.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full px-6 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Home")}>
              <Button
                variant="ghost"
                className="gap-2 text-gray-600 hover:text-gray-900 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-700" />
              Messages
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No messages yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start a conversation by messaging a seller from a listing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Link
                key={`${conv.listing_id}|${conv.other_email}`}
                to={
                  createPageUrl("Conversation") +
                  `?listing_id=${conv.listing_id}&other=${encodeURIComponent(
                    conv.other_email
                  )}`
                }
              >
                <Card className="hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {conv.other_email}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {conv.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {conv.created_date &&
                        formatDistanceToNow(new Date(conv.created_date), {
                          addSuffix: true,
                        })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500">
          For your safety, keep all communication in this app, avoid sharing
          banking details, and meet on campus in public spaces.
        </p>
      </div>
    </div>
  );
}


