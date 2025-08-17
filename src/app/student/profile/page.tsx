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
import { mockStudents } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function StudentProfilePage() {
  const student = mockStudents[0] // Mocking the logged-in student as Alice
  const [rfid, setRfid] = useState(student.rfid || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Profile Updated",
        description: "Your RFID has been successfully saved.",
      })
    }, 1000)
  }

  const getFullName = () => {
    return `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ');
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
              <p className="font-semibold">{student.id}</p>
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
                  <CardTitle>RFID Registration</CardTitle>
                  <CardDescription>
                    Enter the ID from your RFID card to link it to your profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="rfid">RFID Tag ID</Label>
                    <Input
                      type="text"
                      id="rfid"
                      placeholder="e.g., A1B2C3D4"
                      value={rfid}
                      onChange={(e) => setRfid(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save RFID
                  </Button>
                </CardFooter>
              </form>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
