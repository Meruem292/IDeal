
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
import { Loader2, Trash2, Edit, Fingerprint, Users, Search } from "lucide-react"
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
  
  const [mainSearchTerm, setMainSearchTerm] = useState("");
  
  const [quickSectionId, setQuickSectionId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [quickSectionSearchTerm, setQuickSectionSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

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
      const attendanceQuery = await getDocs(collection(db, `students/${selectedStudent.id}/attendance`));
      const batch = writeBatch(db);
      attendanceQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
      });
      batch.delete(doc(db, "students", selectedStudent.id));
      await batch.commit();

      toast({ title: "Student Deleted", description: `Record for ${selectedStudent.firstName} ${selectedStudent.lastName} has been deleted.` })
      fetchStudentsAndSections()
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
        macAddress: selectedStudent.macAddress || null,
      });
      toast({ title: "Student Updated", description: "Student details have been updated." })
      fetchStudentsAndSections()
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
  
  const filteredStudents = useMemo(() => {
    if (!mainSearchTerm) return students;
    const lowercasedTerm = mainSearchTerm.toLowerCase();
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(lowercasedTerm) ||
      (student.rfid && student.rfid.toLowerCase().includes(lowercasedTerm))
    );
  }, [students, mainSearchTerm]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [mainSearchTerm]);
  
  const totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);


  const filteredStudentsForSectioning = useMemo(() => {
    if (!quickSectionSearchTerm) return students;
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(quickSectionSearchTerm.toLowerCase())
    );
  }, [students, quickSectionSearchTerm]);

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
        
        fetchStudentsAndSections();
        setSelectedStudentIds(new Set());
        setQuickSectionSearchTerm("");
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
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name or RFID..."
                            value={mainSearchTerm}
                            onChange={(e) => setMainSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
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
                        {paginatedStudents.map((student) => (
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
                 {totalPages > 1 && (
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                  </CardFooter>
                )}
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
                            value={quickSectionSearchTerm}
                            onChange={(e) => setQuickSectionSearchTerm(e.target.value)}
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
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input 
                    id="macAddress" 
                    value={selectedStudent?.macAddress || ''} 
                    onChange={(e) => setSelectedStudent(s => s ? {...s, macAddress: e.target.value} : null)} 
                    className="font-mono"
                    placeholder="12:34:1A:56:78:90"
                    pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                    title="Please enter a valid MAC address format (e.g., 00:1A:2B:3C:4D:5E)"
                />
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
