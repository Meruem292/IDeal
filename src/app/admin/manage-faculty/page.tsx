"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Edit } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Faculty = {
  id: string
  name: string
  email: string
  subject: string
  role: string
}

export default function ManageFacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchFaculty = async () => {
    setIsLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "faculty"))
      const facultyList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty))
      setFaculty(facultyList)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching faculty",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFaculty()
  }, [toast])

  const handleDelete = async () => {
    if (!selectedFaculty) return
    setIsProcessing(true)
    try {
      await deleteDoc(doc(db, "faculty", selectedFaculty.id))
      toast({ title: "Faculty Deleted", description: `Account for ${selectedFaculty.name} has been deleted.` })
      fetchFaculty() // Refresh list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting faculty",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setSelectedFaculty(null)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFaculty) return
    setIsProcessing(true)
    try {
      const facultyRef = doc(db, "faculty", selectedFaculty.id);
      await updateDoc(facultyRef, {
        name: selectedFaculty.name,
        subject: selectedFaculty.subject,
      });
      toast({ title: "Faculty Updated", description: "Faculty details have been updated." })
      fetchFaculty() // Refresh list
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error updating faculty",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
      setIsEditDialogOpen(false)
      setSelectedFaculty(null)
    }
  }

  const openEditDialog = (facultyMember: Faculty) => {
    setSelectedFaculty(facultyMember)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (facultyMember: Faculty) => {
    setSelectedFaculty(facultyMember)
    setIsDeleteDialogOpen(true)
  }


  return (
    <DashboardLayout role="admin">
      <Card>
        <CardHeader>
          <CardTitle>Manage Faculty</CardTitle>
          <CardDescription>
            View, edit, or delete faculty accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.subject}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)} className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(member)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Faculty</DialogTitle>
              <DialogDescription>
                Update the details for {selectedFaculty?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={selectedFaculty?.name || ''} onChange={(e) => setSelectedFaculty(f => f ? {...f, name: e.target.value} : null)} required />
              </div>
              <div className="grid gap-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={selectedFaculty?.subject || ''} onChange={(e) => setSelectedFaculty(f => f ? {...f, subject: e.target.value} : null)} required />
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the account for {selectedFaculty?.name}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
