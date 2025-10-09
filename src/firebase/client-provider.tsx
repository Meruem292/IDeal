"use client";
import React, { useState, useEffect } from "react";
import { FirebaseProvider } from "./provider";
import { initializeFirebase } from ".";

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseInstances, setFirebaseInstances] = useState<{
    app: ReturnType<typeof initializeFirebase>["app"];
    auth: ReturnType<typeof initializeFirebase>["auth"];
    db: ReturnType<typeof initializeFirebase>["db"];
  } | null>(null);

  useEffect(() => {
    const instances = initializeFirebase();
    setFirebaseInstances(instances);
  }, []);

  if (!firebaseInstances) {
    // You can return a loader here if you want
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseInstances.app}
      auth={firebaseInstances.auth}
      firestore={firebaseInstances.db}
    >
      {children}
    </FirebaseProvider>
  );
}
