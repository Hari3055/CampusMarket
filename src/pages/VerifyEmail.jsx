import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export default function VerifyEmail() {
  const location = useLocation();
  const [status, setStatus] = useState("pending"); // pending | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const token = params.get("token");
    if (!email || !token) {
      setStatus("error");
      setMessage("Missing email or token.");
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Verification failed.");
        }
        setStatus("success");
        setMessage("Your email has been verified. You can now sign in.");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Verification failed.");
      }
    };

    run();
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to={createPageUrl("Home")}>
          <Button
            variant="ghost"
            className="gap-2 text-gray-600 hover:text-gray-900 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <Card className="border-0 shadow-xl shadow-gray-100/50">
          <CardContent className="p-6 sm:p-8 space-y-4 text-center">
            {status === "pending" && (
              <>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTitle className="text-blue-900 font-semibold mb-1">
                    Verifying your email...
                  </AlertTitle>
                  <AlertDescription className="text-blue-800 text-sm">
                    Please wait a moment while we confirm your UFV email.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <Alert className="border-green-200 bg-green-50">
                  <AlertTitle className="text-green-900 font-semibold mb-1">
                    Email verified
                  </AlertTitle>
                  <AlertDescription className="text-green-800 text-sm">
                    {message}
                  </AlertDescription>
                </Alert>
                <Link to="/login">
                  <Button className="mt-3 w-full bg-green-700 hover:bg-green-800">
                    Go to login
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-2">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <Alert className="border-red-200 bg-red-50">
                  <AlertTitle className="text-red-900 font-semibold mb-1">
                    Verification problem
                  </AlertTitle>
                  <AlertDescription className="text-red-800 text-sm">
                    {message}
                  </AlertDescription>
                </Alert>
                <p className="text-xs text-gray-500 mt-2">
                  Try clicking the link in your email again, or request a new
                  verification email by signing up once more if needed.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


