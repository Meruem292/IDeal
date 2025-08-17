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
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  mockFacultyApprovals,
  FacultyApproval,
} from "@/lib/mock-data"
import { Check, X, Building, Mail, User, Loader2 } from "lucide-react"

export default function AdminDashboardPage() {
  const [approvals, setApprovals] = useState<FacultyApproval[]>(mockFacultyApprovals)
  const [loadingStates, setLoadingStates] = useState<Record<string, 'approving' | 'denying' | null>>({});

  const { toast } = useToast()

  const handleDecision = (id: string, decision: "approved" | "denied") => {
    setLoadingStates(prev => ({...prev, [id]: decision === 'approved' ? 'approving' : 'denying'}));
    
    setTimeout(() => {
      const faculty = approvals.find((f) => f.id === id)
      setApprovals((prev) => prev.filter((f) => f.id !== id))
      toast({
        title: `Faculty Account ${decision}`,
        description: `${faculty?.name}'s account has been ${decision}.`,
      })
      setLoadingStates(prev => ({...prev, [id]: null}));
    }, 1000)
  }

  return (
    <DashboardLayout role="admin">
      <Card>
        <CardHeader>
          <CardTitle>Faculty Approval Queue</CardTitle>
          <CardDescription>
            Review and approve or deny new faculty registrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {approvals.map((faculty) => (
                <Card key={faculty.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User /> {faculty.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" /> {faculty.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" /> {faculty.department}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecision(faculty.id, "denied")}
                      disabled={!!loadingStates[faculty.id]}
                    >
                      {loadingStates[faculty.id] === 'denying' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                      Deny
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleDecision(faculty.id, "approved")}
                      disabled={!!loadingStates[faculty.id]}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loadingStates[faculty.id] === 'approving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pending approvals.</p>
              <p className="text-sm">The queue is all clear!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
