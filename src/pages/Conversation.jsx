import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useUfvStudentUser } from "@/hooks/useUfvStudentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Conversation() {
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get("listing_id");
  const otherEmail = urlParams.get("other");

  const { user, loading, isUfvStudent, isVerified } = useUfvStudentUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: listing } = useQuery({
    queryKey: ["conversation-listing", listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const res = await base44.entities.Listing.filter({ id: listingId });
      return res[0];
    },
  });

  const {
    data: messages = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["conversation-messages", listingId, otherEmail, user?.email],
    enabled: !!listingId && !!otherEmail && !!user?.email,
    queryFn: async () => {
      const all = await base44.entities.Message.filter(
        { listing_id: listingId },
        "-created_date"
      );
      return all.filter((m) => {
        const a = m.sender_email;
        const b = m.receiver_email;
        return (
          (a === user.email && b === otherEmail) ||
          (a === otherEmail && b === user.email)
        );
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (!user || !isUfvStudent || !isVerified) return;
      if (user.email === otherEmail) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      await base44.entities.Message.create({
        listing_id: listingId,
        sender_email: user.email,
        sender_name: user.full_name,
        receiver_email: otherEmail,
        content: trimmed.slice(0, 1000),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", listingId, otherEmail, user?.email],
      });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isLoading) return;
    sendMutation.mutate(trimmed);
    setMessage("");
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!user || !isUfvStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full px-6 lg:px-10 py-8">
          <Link to={createPageUrl("Messages")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to messages
            </Button>
          </Link>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTitle className="text-blue-900 font-semibold mb-2">
              Sign in with your UFV email
            </AlertTitle>
            <AlertDescription className="text-blue-800">
              You need a verified <strong>@student.ufv.ca</strong> email to view
              this conversation.
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
          <Link to={createPageUrl("Messages")}>
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to messages
            </Button>
          </Link>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTitle className="text-amber-900 font-semibold mb-2">
              Verify your UFV email
            </AlertTitle>
            <AlertDescription className="text-amber-800">
              To protect students, only verified UFV emails can send and receive
              messages. Please complete email verification and sign in again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full px-6 lg:px-10 py-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Messages")}>
              <Button
                variant="ghost"
                className="gap-2 text-gray-600 hover:text-gray-900 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-700" />
              Conversation
            </h1>
          </div>
        </div>

        {listing && (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {listing.title}
                </p>
                <p className="text-xs text-gray-500">
                  {listing.campus === "abbotsford"
                    ? "Abbotsford campus"
                    : "Chilliwack campus"}
                </p>
              </div>
              <Link to={createPageUrl("ListingDetails") + `?id=${listing.id}`}>
                <Button variant="outline" size="sm">
                  View listing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 min-h-[300px] bg-white border rounded-xl shadow-sm flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-gray-500 text-center mt-6">
                No messages yet. Say hi and ask about the item.
              </p>
            ) : (
              messages
                .slice()
                .reverse()
                .map((msg) => {
                  const isMine = msg.sender_email === user.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs ${
                          isMine
                            ? "bg-green-700 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.created_date && (
                          <p
                            className={`mt-1 text-[10px] ${
                              isMine ? "text-green-100" : "text-gray-400"
                            }`}
                          >
                            {format(new Date(msg.created_date), "MMM d, h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <div className="border-t p-3 space-y-2">
            <Textarea
              rows={2}
              placeholder="Type your message (don’t share banking details or passwords)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <ShieldCheck className="h-3 w-3" />
                <span>
                  Meet on campus in public areas. Avoid sharing financial info.
                </span>
              </div>
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800"
                disabled={
                  sendMutation.isLoading || !message.trim() || !listingId
                }
                onClick={handleSend}
              >
                {sendMutation.isLoading ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


