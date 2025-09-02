
"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserRole = "student" | "faculty" | "admin";

export function useAuthRole(requiredRole: UserRole) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          let actualRole: UserRole | null = null;
          
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            actualRole = "admin";
          } else {
            const facultyDoc = await getDoc(doc(db, "faculty", user.uid));
            if (facultyDoc.exists()) {
              actualRole = "faculty";
            } else {
              const studentDoc = await getDoc(doc(db, "students", user.uid));
              if (studentDoc.exists()) {
                actualRole = "student";
              }
            }
          }

          if (actualRole === requiredRole) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            // Optional: Redirect to login or an unauthorized page
            // We handle this in the component to avoid hook-based navigation side-effects
          }
        } catch (error) {
          console.error("Error verifying user role:", error);
          setIsAuthorized(false);
        }
      } else {
        // Not logged in
        setIsAuthorized(false);
        router.push("/login");
      }
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [requiredRole, router]);

  return { isChecking, isAuthorized };
}
