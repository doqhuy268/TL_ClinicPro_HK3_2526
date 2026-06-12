'use client';

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { exchangeGoogleAuthCode, GOOGLE_LOGIN_ERROR_MESSAGE } from "@/lib/utils/googleAuth";
import { getRedirectPathByRole } from "@/lib/utils/redirect";
import { useAuth } from "@/lib/hooks/useAuth";

const GOOGLE_PROCESSING_KEY = "google_auth_processing";

export function GoogleAuthListener() {
  const router = useRouter();
  const { reloadAuth } = useAuth();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const authCode = currentUrl.searchParams.get("code");

    if (!authCode || isProcessing.current) {
      return;
    }

    isProcessing.current = true;
    sessionStorage.setItem(GOOGLE_PROCESSING_KEY, "true");

    const cleanupUrlParams = () => {
      const paramsToRemove = ["code", "scope", "authuser", "prompt"];
      paramsToRemove.forEach((param) => currentUrl.searchParams.delete(param));
      const newSearch = currentUrl.searchParams.toString();
      const cleanUrl = `${currentUrl.pathname}${newSearch ? `?${newSearch}` : ""}${currentUrl.hash}`;
      window.history.replaceState({}, document.title, cleanUrl);
    };

    cleanupUrlParams();

    exchangeGoogleAuthCode(authCode)
      .then(async (user) => {
        await reloadAuth();
        if (user) {
          const redirectPath = getRedirectPathByRole(user.role);
          router.replace(redirectPath);
        } else {
          router.replace("/");
        }
      })
      .catch((error) => {
        console.error("Google login processing error:", error);
        sessionStorage.setItem("login_error", GOOGLE_LOGIN_ERROR_MESSAGE);
      })
      .finally(() => {
        isProcessing.current = false;
        sessionStorage.removeItem(GOOGLE_PROCESSING_KEY);
      });
  }, [router, reloadAuth]);

  return null;
}

