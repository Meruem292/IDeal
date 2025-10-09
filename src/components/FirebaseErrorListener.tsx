"use client";

import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import type { FirestorePermissionError } from "@/firebase/errors";

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, Next.js will show a detailed error overlay for uncaught exceptions.
      // We throw the error here to trigger that overlay.
      if (process.env.NODE_ENV === "development") {
        // We throw it in a timeout to break out of the current React render cycle
        // and ensure it's treated as a new, uncaught exception.
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // In production, you might want to log this to a service like Sentry,
        // or display a more user-friendly notification.
        console.error("Firestore Permission Error:", error.message, error.context);
      }
    };

    errorEmitter.on("permission-error", handlePermissionError);

    return () => {
      errorEmitter.off("permission-error", handlePermissionError);
    };
  }, []);

  return null; // This component does not render anything
}
