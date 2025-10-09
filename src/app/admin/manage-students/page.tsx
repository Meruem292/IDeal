
"use client"
import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Loader2, Trash2, Edit, Fingerprint, Users } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore"
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
import { Badge } from "@/components/ui/badge"
import type { Student } from "@/lib/mock-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

type Section = {
  id: string
  name: string
}
export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // State for Quick Sectioning
  const [quickSectionId, setQuickSectionId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast()

  const fetchStudentsAndSections = async () => {
    setIsLoading(true)
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"))
      const studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student))
      
      const sectionsSnapshot = await getDocs(collection(db, "sections"))
      const sectionList = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section))

      const studentsWithSectionNames = studentList.map(student => {
        const section = sectionList.find(s => s.id === student.sectionId)
        return { ...student, section: section?.name || "Unassigned" }
      })

      setStudents(studentsWithSectionNames.sort((a,b) => a.lastName.localeCompare(b.lastName)))
      setSections(sectionList)

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentsAndSections()
  }, [])

  const handleDelete = async () => {
    if (!selectedStudent) return
    setIsProcessing(true)
    try {
      // Also delete related attendance if any
      const attendanceQuery = await getDocs(collection(db, `students/${selectedStudent.id}/attendance`));
      const batch = writeBatch(db);
      attendanceQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
      });
      batch.delete(doc(db, "students", selectedStudent.id));
      await batch.commit();

      toast({ title: "Student Deleted", description: `Record for ${selectedStudent.firstName} ${selectedStudent.lastName} has been deleted.` })
      fetchStudentsAndSections() // Refresh list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting student",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setSelectedStudent(null)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setIsProcessing(true)
    try {
      const studentRef = doc(db, "students", selectedStudent.id);
      const sectionIdToSave = selectedStudent.sectionId === '__UNASSIGNED__' ? null : selectedStudent.sectionId;

      await updateDoc(studentRef, {
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        address: selectedStudent.address,
        sectionId: sectionIdToSave,
      });
      toast({ title: "Student Updated", description: "Student details have been updated." })
      fetchStudentsAndSections() // Refresh list
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error updating student",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
      setIsEditDialogOpen(false)
      setSelectedStudent(null)
    }
  }

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (student: Student) => {
    setSelectedStudent(student)
    setIsDeleteDialogOpen(true)
  }

  const filteredStudentsForSectioning = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedStudentIds(new Set(filteredStudentsForSectioning.map(s => s.id)));
    } else {
        setSelectedStudentIds(new Set());
    }
  };

  const handleAssignToSection = async () => {
    if (!quickSectionId) {
        toast({ variant: "destructive", title: "No Section Selected", description: "Please select a section to assign students to." });
        return;
    }
    if (selectedStudentIds.size === 0) {
        toast({ variant: "destructive", title: "No Students Selected", description: "Please select at least one student." });
        return;
    }

    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        selectedStudentIds.forEach(studentId => {
            const studentRef = doc(db, "students", studentId);
            batch.update(studentRef, { sectionId: quickSectionId });
        });
        await batch.commit();

        toast({ title: "Students Assigned", description: `${selectedStudentIds.size} student(s) have been assigned to the section.` });
        
        // Refresh data and reset state
        fetchStudentsAndSections();
        setSelectedStudentIds(new Set());
        setSearchTerm("");
        setQuickSectionId("");

    } catch (error: any) {
         toast({ variant: "destructive", title: "Assignment Failed", description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Manage Students</CardTitle>
                <CardDescription>
                    View, edit, or delete student records.
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
                        <TableHead>Section</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>RFID Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium">{`${student.lastName}, ${student.firstName}`}</TableCell>
                            <TableCell>{student.section}</TableCell>
                            <TableCell>{student.gender}</TableCell>
                            <TableCell>
                            <Badge
                                variant={student.rfid ? "secondary" : "outline"}
                                className={`flex w-fit items-center gap-1.5 ${student.rfid ? 'text-primary border-primary/20 bg-primary/10' : ''}`}
                            >
                                <Fingerprint className="h-3 w-3" />
                                {student.rfid ? "Registered" : "Not Registered"}
                            </Badge>
                        </TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)} className="mr-2">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(student)} className="text-destructive hover:text-destructive">
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
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Quick Sectioning</CardTitle>
                    <CardDescription>
                        Assign multiple students to a section at once.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-1.5">
                        <Label htmlFor="quick-section">1. Select a Section</Label>
                        <Select value={quickSectionId} onValueChange={setQuickSectionId} disabled={isProcessing}>
                          <SelectTrigger id="quick-section">
                            <SelectValue placeholder="Choose a section" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map(section => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="grid gap-1.5">
                        <Label htmlFor="student-search">2. Select Students</Label>
                        <Input
                            id="student-search"
                            placeholder="Search student name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                       </div>
                       <ScrollArea className="h-72 w-full rounded-md border">
                            <div className="p-4">
                               <div className="flex items-center space-x-2 pb-2 border-b mb-2">
                                    <Checkbox
                                        id="select-all"
                                        onCheckedChange={handleSelectAll}
                                        checked={selectedStudentIds.size > 0 && selectedStudentIds.size === filteredStudentsForSectioning.length}
                                        disabled={filteredStudentsForSectioning.length === 0}
                                    />
                                    <Label htmlFor="select-all" className="font-semibold">
                                        Select All ({selectedStudentIds.size} / {filteredStudentsForSectioning.length})
                                    </Label>
                                </div>
                                {filteredStudentsForSectioning.length > 0 ? (
                                    filteredStudentsForSectioning.map(student => (
                                        <div key={student.id} className="flex items-center space-x-2 py-1.5">
                                            <Checkbox
                                                id={`student-${student.id}`}
                                                checked={selectedStudentIds.has(student.id)}
                                                onCheckedChange={() => handleStudentSelection(student.id)}
                                            />
                                            <Label htmlFor={`student-${student.id}`} className="font-normal w-full cursor-pointer">
                                                {`${student.lastName}, ${student.firstName}`}
                                                <span className="text-xs text-muted-foreground ml-2">({student.section})</span>
                                            </Label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground py-4">No students found.</div>
                                )}
                            </div>
                       </ScrollArea>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleAssignToSection} disabled={isProcessing || selectedStudentIds.size === 0 || !quickSectionId}>
                         {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                        Assign {selectedStudentIds.size} Students
                    </Button>
                </CardFooter>
             </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update the details for {selectedStudent?.firstName}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-1.5">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={selectedStudent?.firstName || ''} onChange={(e) => setSelectedStudent(s => s ? {...s, firstName: e.target.value} : null)} required />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={selectedStudent?.lastName || ''} onChange={(e) => setSelectedStudent(s => s ? {...s, lastName: e.target.value} : null)} required />
                </div>
              </div>
               <div className="grid gap-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={selectedStudent?.address || ''} onChange={(e) => setSelectedStudent(s => s ? {...s, address: e.target.value} : null)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={selectedStudent?.sectionId || "__UNASSIGNED__"}
                  onValueChange={(value) => setSelectedStudent(s => s ? { ...s, sectionId: value } : null)}
                >
                  <SelectTrigger id="section">
                    <SelectValue placeholder="Assign a section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__UNASSIGNED__">Unassigned</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                This action cannot be undone. This will permanently delete the record for {selectedStudent?.firstName} {selectedStudent?.lastName}.
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
