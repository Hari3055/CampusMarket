import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Lock } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const next = params.get("next") || createPageUrl("Home");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.login({ email, password });
      navigate(next);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <Lock className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sign in to Campus Market
                </h1>
                <p className="text-gray-500 text-sm">
                  Use your <strong>@student.ufv.ca</strong> email.
                </p>
              </div>
            </div>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertTitle className="text-red-800">Login failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">UFV Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-green-700 hover:bg-green-800 rounded-xl"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-green-700 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


