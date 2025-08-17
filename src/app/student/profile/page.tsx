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

  return (
    <DashboardLayout role="student">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              View and manage your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Student ID</Label>
              <p className="font-semibold">{student.id}</p>
            </div>
            <div>
              <Label>Name</Label>
              <p className="font-semibold">{student.name}</p>
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
    </DashboardLayout>
  )
}
