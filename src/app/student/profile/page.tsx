
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
import { Loader2, AlertCircle } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import type { Student } from "@/lib/mock-data"
import { Skeleton } from "@/components/ui/skeleton"

function ProfileSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"> <Skeleton className="h-4 w-20" /> <Skeleton className="h-5 w-24" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-20" /> <Skeleton className="h-5 w-24" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-20" /> <Skeleton className="h-5 w-24" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-12" /> <Skeleton className="h-5 w-16" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-16" /> <Skeleton className="h-5 w-20" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-20" /> <Skeleton className="h-5 w-28" /> </div>
                     </div>
                     <div className="space-y-2"> <Skeleton className="h-4 w-20" /> <Skeleton className="h-5 w-full" /> </div>
                     <div className="space-y-2"> <Skeleton className="h-4 w-24" /> <Skeleton className="h-5 w-32" /> </div>
                </CardContent>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader><Skeleton className="h-8 w-40" /></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"> <Skeleton className="h-4 w-24" /> <Skeleton className="h-5 w-36" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-20" /> <Skeleton className="h-5 w-24" /> </div>
                        <div className="space-y-2"> <Skeleton className="h-4 w-28" /> <Skeleton className="h-5 w-32" /> </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-28" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({ rfid: "", macAddress: "" });
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const studentDocRef = doc(db, "students", user.uid)
          const studentDoc = await getDoc(studentDocRef)

          if (studentDoc.exists()) {
            const studentData = studentDoc.data() as Student
            setStudent(studentData)
            setFormData({
                rfid: studentData.rfid || "",
                macAddress: studentData.macAddress || ""
            })
          } else {
            setError("No student profile found for your account.")
          }
        } catch (err) {
          console.error("Error fetching student profile:", err)
          setError("Failed to fetch your profile. Please try again later.")
        } finally {
          setIsLoading(false)
        }
      } else {
        // Handle case where user is not logged in
        setIsLoading(false)
        setError("You must be logged in to view this page.")
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "You must be logged in to update your profile.",
      })
      return
    }

    setIsSaving(true)
    try {
      const studentDocRef = doc(db, "students", auth.currentUser.uid)
      const dataToUpdate = {
          rfid: formData.rfid.trim() || null,
          macAddress: formData.macAddress.trim() || null
      }
      await updateDoc(studentDocRef, dataToUpdate)

      // Also update local state
      if(student) {
        setStudent({...student, ...dataToUpdate});
      }

      toast({
        title: "Profile Updated",
        description: "Your credentials have been successfully saved.",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "An unknown error occurred.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  }

  if (isLoading) {
    return (
        <DashboardLayout role="student">
            <ProfileSkeleton />
        </DashboardLayout>
    )
  }

  if (error) {
    return (
        <DashboardLayout role="student">
            <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-destructive text-destructive p-8">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold">An Error Occurred</h2>
                <p>{error}</p>
            </div>
        </DashboardLayout>
    )
  }
  
  if (!student) {
     return (
        <DashboardLayout role="student">
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed p-8">
                <h2 className="text-xl font-semibold">No Profile Data</h2>
                <p>We couldn't find your student profile.</p>
            </div>
        </DashboardLayout>
    )
  }


  return (
    <DashboardLayout role="student">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              View and manage your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <p className="font-semibold">{student.firstName}</p>
              </div>
              {student.middleName && <div>
                <Label>Middle Name</Label>
                <p className="font-semibold">{student.middleName}</p>
              </div>}
              <div>
                <Label>Last Name</Label>
                <p className="font-semibold">{student.lastName}</p>
              </div>
               <div>
                <Label>Age</Label>
                <p className="font-semibold">{student.age}</p>
              </div>
              <div>
                <Label>Gender</Label>
                <p className="font-semibold">{student.gender}</p>
              </div>
              <div>
                <Label>Birthday</Label>
                <p className="font-semibold">{new Date(student.birthday).toLocaleDateString()}</p>
              </div>
            </div>
             <div>
                <Label>Address</Label>
                <p className="font-semibold">{student.address}</p>
              </div>
            <div>
              <Label>Student ID</Label>
              <p className="font-semibold font-mono text-xs">{student.id}</p>
            </div>
             
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Guardian Name</Label>
                  <p className="font-semibold">{student.guardian.name}</p>
                </div>
                 <div>
                  <Label>Relationship</Label>
                  <p className="font-semibold">{student.guardian.relationship}</p>
                </div>
                 <div>
                  <Label>Contact Number</Label>
                  <p className="font-semibold">{student.guardian.contactNumber}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>My Credentials</CardTitle>
                  <CardDescription>
                    Enter your device IDs to link them to your profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="rfid">RFID Tag ID</Label>
                    <Input
                      type="text"
                      id="rfid"
                      placeholder="e.g., 766EF94D"
                      value={formData.rfid}
                      onChange={(e) => setFormData(prev => ({...prev, rfid: e.target.value.toUpperCase()}))}
                      className="font-mono"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="macAddress">MAC Address</Label>
                    <Input
                      type="text"
                      id="macAddress"
                      placeholder="e.g., 00:1A:2B:3C:4D:5E"
                      value={formData.macAddress}
                      onChange={handleInputChange}
                      className="font-mono"
                      disabled={isSaving}
                      pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                      title="Please enter a valid MAC address format (e.g., 00:1A:2B:3C:4D:5E)"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Credentials
                  </Button>
                </CardFooter>
              </form>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

    