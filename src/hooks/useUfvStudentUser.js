import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const UFV_STUDENT_DOMAIN = "@student.ufv.ca";

export function isUfvStudentEmail(email) {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().endsWith(UFV_STUDENT_DOMAIN);
}

export function useUfvStudentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const me = await base44.auth.me();

        // Enforce UFV student domain on the client as an extra guard.
        if (!isUfvStudentEmail(me?.email)) {
          if (!cancelled) {
            setUser(null);
          }
        } else if (!cancelled) {
          setUser(me);
        }
      } catch (e) {
        console.error("Failed to load user", e);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    const handleAuthChange = () => {
      load();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cm-auth-changed", handleAuthChange);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("cm-auth-changed", handleAuthChange);
      }
    };
  }, []);

  const isUfvStudent = isUfvStudentEmail(user?.email);
  const isVerified =
    !!user?.email_verified || !!user?.emailVerified || !!user?.verifiedAt;

  return { user, loading, isUfvStudent, isVerified };
}


