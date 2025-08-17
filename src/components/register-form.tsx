"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
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
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RegisterForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Student fields
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("")
  const [birthday, setBirthday] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Guardian fields
  const [guardianName, setGuardianName] = useState("")
  const [guardianRelationship, setGuardianRelationship] = useState("")
  const [guardianContact, setGuardianContact] = useState("")


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!gender) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Please select a gender.",
      })
      setIsLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "students", user.uid), {
        id: user.uid,
        firstName,
        middleName: middleName || null,
        lastName,
        age: parseInt(age, 10),
        gender,
        birthday,
        address,
        email, 
        guardian: {
          name: guardianName,
          relationship: guardianRelationship,
          contactNumber: guardianContact,
        },
        rfid: null,
        status: "active" 
      });

      toast({
        title: "Registration Successful",
        description: "Student account created successfully. Redirecting to login...",
      })
      
      router.push("/login")

    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminCreation = async () => {
    setIsLoading(true);
    try {
      const adminEmail = "admin@gmail.com";
      const adminPassword = "admin123";
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      toast({
        title: "Admin Account Created",
        description: "The default admin account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Admin Creation Failed",
        description: error.code === 'auth/email-already-in-use' 
          ? "Admin account already exists." 
          : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="absolute top-8 left-8">
         <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <CheckCircle className="h-8 w-8 text-accent" />
            <span className="font-headline">IDeal</span>
         </Link>
       </div>
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Register a New Student</CardTitle>
            <CardDescription>
              Enter the details below to create a new student account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[50vh] pr-6">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold text-primary">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="John" required disabled={isLoading} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="middle-name">Middle Name (Optional)</Label>
                    <Input id="middle-name" placeholder="Michael" disabled={isLoading} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" placeholder="Doe" required disabled={isLoading} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" placeholder="20" required disabled={isLoading} value={age} onChange={(e) => setAge(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select onValueChange={(v) => setGender(v as any)} value={gender} disabled={isLoading}>
                            <SelectTrigger id="gender">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="birthday">Birthday</Label>
                        <Input id="birthday" type="date" required disabled={isLoading} value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                    </div>
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 University Ave" required disabled={isLoading} value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                <h3 className="text-lg font-semibold text-primary pt-4">Guardian Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="guardian-name">Guardian Full Name</Label>
                        <Input id="guardian-name" placeholder="Jane Doe" required disabled={isLoading} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guardian-relationship">Relationship</Label>
                        <Input id="guardian-relationship" placeholder="Mother" required disabled={isLoading} value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guardian-contact">Contact Number</Label>
                        <Input id="guardian-contact" placeholder="+639-123-456-789" required disabled={isLoading} value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} />
                    </div>
                </div>

                 <h3 className="text-lg font-semibold text-primary pt-4">Account Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="name@example.com" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Student Account
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="underline hover:text-primary">
                    Login
                </Link>
            </div>
          </CardFooter>
        </form>
         <CardFooter className="flex flex-col gap-4">
            <Button variant="secondary" className="w-full" onClick={handleAdminCreation} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Account (One-Time)
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
