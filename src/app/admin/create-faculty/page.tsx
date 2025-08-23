
"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { db, auth } from "@/lib/firebase" 
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { initializeApp, deleteApp }from "firebase/app"

export default function CreateFacultyPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [subject, setSubject] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // One-time check to create the admin document if it doesn't exist
  useEffect(() => {
    const bootstrapAdmin = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email === 'admin@gmail.com') {
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists()) {
          try {
            await setDoc(adminDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'admin'
            });
            console.log("Admin document created in Firestore.");
          } catch (error: any) {
             console.error("Failed to create admin document:", error);
             toast({
              variant: "destructive",
              title: "Admin Init Failed",
              description: error.message,
            });
          }
        }
      }
    };
    
    // We need to wait for the auth state to be initialized
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        bootstrapAdmin();
        unsubscribe();
      }
    });

    return () => unsubscribe();
  }, [toast]);


  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Validate that all config values are present
    const missingConfigKeys = Object.entries(firebaseConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingConfigKeys.length > 0) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: `Missing Firebase config values for: ${missingConfigKeys.join(", ")}. Please check your .env.local file.`,
      });
      setIsLoading(false);
      return;
    }


    let secondaryApp;
    try {
      const secondaryAppName = `secondary-auth-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;

      // This write is performed by the LOGGED IN ADMIN, using the primary `db` instance
      await setDoc(doc(db, "faculty", user.uid), {
        id: user.uid,
        name,
        email,
        subject,
        role: 'faculty',
      });

      toast({
        title: "Faculty Account Created",
        description: `Account for ${name} has been created successfully.`,
      })
      
      setName("")
      setEmail("")
      setPassword("")
      setSubject("")

    } catch (error: any) {
      console.error("Error creating faculty:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || "An unknown error occurred.",
      })
    } finally {
      setIsLoading(false)
       if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-lg">
          <form onSubmit={handleCreateFaculty}>
            <CardHeader>
              <CardTitle>Create Faculty Account</CardTitle>
              <CardDescription>
                Enter the details below to create a new faculty account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Dr. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  type="text"
                  id="subject"
                  placeholder="e.g., Computer Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="faculty@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
