
"use client"
import { useState } from "react"
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
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"

export default function CreateFacultyPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [department, setDepartment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // We can't use the regular auth object because the admin is already signed in.
      // We need to create a temporary app instance to create a new user.
      // This is a common pattern for admin panels.
      // NOTE: This will require a second Firebase app initialization.
      // For this to work in a real app, you might need a separate admin SDK setup on a backend.
      // For client-side, this approach is a workaround. A more robust solution would use Cloud Functions.

      // For the purpose of this prototype, we'll simulate the creation without a secondary app.
      // In a real app, you'd use the Admin SDK on a server to create users.
      
      // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // const user = userCredential.user;

      // Mocking user creation for now
      const mockUserId = `faculty_${new Date().getTime()}`

      await setDoc(doc(db, "faculty", mockUserId), {
        id: mockUserId,
        name,
        email,
        department,
        role: 'faculty',
      });

      toast({
        title: "Faculty Account Created",
        description: `Account for ${name} has been created successfully.`,
      })
      
      // Clear form
      setName("")
      setEmail("")
      setPassword("")
      setDepartment("")

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
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
                <Label htmlFor="department">Department</Label>
                <Input
                  type="text"
                  id="department"
                  placeholder="e.g., Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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
