import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createPageUrl } from "@/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }
      setSuccess(
        "Account created. Check your UFV inbox for a verification email. You can also use the link below in development."
      );
      if (data.verifyUrl) {
        setSuccess(
          `Account created. Check your email, or click this link in development: ${data.verifyUrl}`
        );
      }
    } catch (err) {
      setError(err.message || "Signup failed");
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
                <UserPlus className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create your account
                </h1>
                <p className="text-gray-500 text-sm">
                  Use your <strong>@student.ufv.ca</strong> email.
                </p>
              </div>
            </div>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertTitle className="text-red-800">Signup failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertTitle className="text-green-800">
                  Check your email
                </AlertTitle>
                <AlertDescription className="text-green-700 text-xs whitespace-pre-wrap">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  At least 8 characters.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-green-700 hover:bg-green-800 rounded-xl"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-green-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


