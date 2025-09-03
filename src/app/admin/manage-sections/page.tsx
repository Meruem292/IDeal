
"use client"
import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2, Trash2, Edit, PlusCircle, Calendar as CalendarIcon, X, Upload, Scan, BookUser } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, writeBatch, query, where } from "firebase/firestore"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { parseSchedule } from "@/ai/flows/schedule-parser-flow"
import { z } from "zod"
import { ScheduleEntrySchema } from "@/ai/schemas/schedule-parser-types"
import type { Student } from "@/lib/mock-data"

type Section = {
  id: string
  name: string
  adviserId: string
  adviserName: string
}

type Faculty = {
  id: string
  name: string
}

type Schedule = {
    id: string
    subject: string
    startTime: string
    endTime: string
    facultyId?: string | null
    facultyName?: string
}

type EditableScheduleEntry = z.infer<typeof ScheduleEntrySchema> & {
    facultyId?: string | null;
};

export default function ManageSectionsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentsInSection, setStudentsInSection] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isEditScheduleDialogOpen, setIsEditScheduleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isScanReviewDialogOpen, setIsScanReviewDialogOpen] = useState(false)
  
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [scannedSchedules, setScannedSchedules] = useState<EditableScheduleEntry[]>([]);


  const [scheduleImage, setScheduleImage] = useState<File | null>(null);
  const [scheduleImagePreview, setScheduleImagePreview] = useState<string | null>(null);


  const { toast } = useToast()

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const sectionsSnapshot = await getDocs(collection(db, "sections"))
      const sectionsList = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section))
      setSections(sectionsList)

      const facultySnapshot = await getDocs(collection(db, "faculty"))
      const facultyList = facultySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Faculty))
      setFaculty(facultyList)

      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setAllStudents(studentList);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error fetching data", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchedules = async (sectionId: string) => {
    try {
        const schedulesSnapshot = await getDocs(collection(db, `sections/${sectionId}/schedules`));
        let schedulesList = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
        
        schedulesList = schedulesList.map(schedule => ({
            ...schedule,
            facultyName: faculty.find(f => f.id === schedule.facultyId)?.name || 'N/A'
        }));
        
        setSchedules(schedulesList.sort((a,b) => a.startTime.localeCompare(b.startTime)));
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error fetching schedules", description: error.message });
        setSchedules([]);
    }
  }
  
  useEffect(() => {
    fetchInitialData()
  }, [])
  
  useEffect(() => {
    if (selectedSection) {
        setIsLoading(true);
        fetchSchedules(selectedSection.id);
        const filteredStudents = allStudents.filter(student => student.sectionId === selectedSection.id);
        setStudentsInSection(filteredStudents.sort((a,b) => a.lastName.localeCompare(b.lastName)));
        setIsLoading(false);
    } else {
        setSchedules([]);
        setStudentsInSection([]);
    }
  }, [selectedSection, allStudents, faculty]);

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSection || !selectedSection.adviserId) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please select an adviser." })
        return
    }
    setIsProcessing(true)

    const adviser = faculty.find(f => f.id === selectedSection.adviserId);
    if (!adviser) {
        toast({ variant: "destructive", title: "Invalid Adviser", description: "The selected adviser could not be found." });
        setIsProcessing(false);
        return;
    }

    const sectionData = {
        name: selectedSection.name,
        adviserId: selectedSection.adviserId,
        adviserName: adviser.name,
    };
    
    try {
      if (selectedSection.id === 'new') { // Creating new section
        await addDoc(collection(db, "sections"), sectionData)
        toast({ title: "Section Created", description: `Section ${sectionData.name} has been created.` })
      } else { // Updating existing section
        const sectionRef = doc(db, "sections", selectedSection.id);
        await updateDoc(sectionRef, sectionData);
        toast({ title: "Section Updated", description: "Section details have been updated." })
      }
      fetchInitialData()
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error saving section", description: error.message })
    } finally {
      setIsProcessing(false)
      setIsSectionDialogOpen(false)
      setSelectedSection(null)
    }
  }
  
  const handleScheduleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !selectedSchedule) return;
    setIsProcessing(true);

    try {
      const { id, facultyName, ...scheduleData } = selectedSchedule;
      const facultyIdToSave = scheduleData.facultyId === '__none__' ? null : scheduleData.facultyId;
      await updateDoc(doc(db, `sections/${selectedSection.id}/schedules`, id), { ...scheduleData, facultyId: facultyIdToSave });
      toast({ title: "Schedule Updated" });
      fetchSchedules(selectedSection.id);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error saving schedule(s)", description: error.message });
    } finally {
        setIsProcessing(false);
        setIsEditScheduleDialogOpen(false);
        setSelectedSchedule(null);
    }
  };


  const handleDeleteSection = async () => {
    if (!selectedSection) return
    setIsProcessing(true)
    try {
      const batch = writeBatch(db);
      const schedulesSnapshot = await getDocs(collection(db, `sections/${selectedSection.id}/schedules`));
      schedulesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, "sections", selectedSection.id));
      await batch.commit();

      toast({ title: "Section Deleted", description: `Section ${selectedSection.name} has been deleted.` })
      fetchInitialData()
      setSelectedSection(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error deleting section", description: error.message })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
    }
  }
  
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!selectedSection) return;
    setIsProcessing(true);
    try {
        await deleteDoc(doc(db, `sections/${selectedSection.id}/schedules`, scheduleId));
        toast({ title: "Schedule Deleted" });
        fetchSchedules(selectedSection.id);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error deleting schedule", description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };


  const openSectionDialog = (section?: Section) => {
    setSelectedSection(section || { id: 'new', name: '', adviserId: '', adviserName: '' })
    setIsSectionDialogOpen(true)
  }

  const openEditScheduleDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsEditScheduleDialogOpen(true);
  };

  const openDeleteDialog = (section: Section) => {
    setSelectedSection(section)
    setIsDeleteDialogOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScheduleImage(file);
      setScheduleImagePreview(URL.createObjectURL(file));
    }
  };

  const handleScanSchedule = async () => {
    if (!scheduleImage || !selectedSection) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a section and upload an image first.",
      });
      return;
    }
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(scheduleImage);
      reader.onload = async () => {
        const photoDataUri = reader.result as string;
        const result = await parseSchedule({ photoDataUri });
        
        if (result.schedules.length === 0) {
            toast({
                title: "Scan Complete",
                description: "No schedules were found in the image.",
            });
            setIsScanning(false);
            return;
        }
        
        setScannedSchedules(result.schedules.map(s => ({...s, facultyId: null})));
        setIsScanReviewDialogOpen(true);

        // Reset image state
        setScheduleImage(null);
        setScheduleImagePreview(null);
        // Clear file input
        const fileInput = document.getElementById('picture') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      };

      reader.onerror = (error) => {
        throw new Error("Failed to read image file.");
      }

    } catch (error: any) {
      console.error("Error scanning schedule:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: error.message || "Could not parse schedule from image.",
      });
    } finally {
      setIsScanning(false);
    }
  };
  
    const handleScannedScheduleChange = (index: number, field: keyof EditableScheduleEntry, value: string | null) => {
        const updatedSchedules = [...scannedSchedules];
        updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
        setScannedSchedules(updatedSchedules);
    };

    const handleSaveScannedSchedules = async () => {
        if (!selectedSection) return;

        const validSchedules = scannedSchedules.filter(s => s.subject && s.startTime && s.endTime);
        if (validSchedules.length !== scannedSchedules.length) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill out at least subject, start time, and end time for all schedules.' });
            return;
        }

        // Overlap validation
        for (let i = 0; i < validSchedules.length; i++) {
            for (let j = i + 1; j < validSchedules.length; j++) {
                const s1 = validSchedules[i];
                const s2 = validSchedules[j];
                if (s1.startTime! < s2.endTime! && s2.startTime! < s1.endTime!) {
                    toast({
                        variant: 'destructive',
                        title: 'Schedule Overlap',
                        description: `Schedules for "${s1.subject}" and "${s2.subject}" are overlapping.`,
                    });
                    return;
                }
            }
        }
        
        setIsProcessing(true);
        try {
            const batch = writeBatch(db);
            validSchedules.forEach(schedule => {
                const { facultyId, ...restOfSchedule } = schedule;
                const facultyIdToSave = facultyId === '__none__' ? null : facultyId;

                const scheduleData = {
                    ...restOfSchedule,
                    facultyId: facultyIdToSave
                }
                const newScheduleRef = doc(collection(db, `sections/${selectedSection.id}/schedules`));
                batch.set(newScheduleRef, scheduleData);
            });
            await batch.commit();
            toast({ title: "Schedules Created", description: `Added ${validSchedules.length} new schedule(s) from scan.` });
            fetchSchedules(selectedSection.id);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error saving schedules", description: error.message });
        } finally {
            setIsProcessing(false);
            setIsScanReviewDialogOpen(false);
            setScannedSchedules([]);
        }
    };


  return (
    <DashboardLayout role="admin">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Sections</CardTitle>
                    <CardDescription>
                        Create, edit, or delete class sections.
                    </CardDescription>
                </div>
                <Button onClick={() => openSectionDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                </Button>
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
                        <TableHead>Section Name</TableHead>
                        <TableHead>Adviser</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sections.map((section) => (
                        <TableRow 
                            key={section.id} 
                            onClick={() => setSelectedSection(section)}
                            className={`cursor-pointer ${selectedSection?.id === section.id ? 'bg-muted/50' : ''}`}
                        >
                            <TableCell className="font-medium">{section.name}</TableCell>
                            <TableCell>{section.adviserName}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openSectionDialog(section)}} className="mr-2">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteDialog(section)}} className="text-destructive hover:text-destructive">
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

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload & Scan Schedule</CardTitle>
                        <CardDescription>
                           Select a section, upload its schedule image, and let AI do the work.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Selected Section: <span className="font-semibold text-primary">{selectedSection?.name || 'None'}</span>
                        </div>
                        <Input id="picture" type="file" accept="image/*" onChange={handleImageUpload} disabled={!selectedSection || isScanning}/>
                        {scheduleImagePreview && (
                            <div className="relative mt-4">
                                <Image 
                                    src={scheduleImagePreview} 
                                    alt="Schedule preview" 
                                    width={400} 
                                    height={400} 
                                    className="rounded-md object-contain max-h-48 w-full"
                                />
                                <Button 
                                    variant="destructive" 
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => {
                                        setScheduleImage(null);
                                        setScheduleImagePreview(null);
                                        const fileInput = document.getElementById('picture') as HTMLInputElement;
                                        if (fileInput) fileInput.value = '';
                                    }}
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleScanSchedule} disabled={!scheduleImage || !selectedSection || isScanning}>
                            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scan className="mr-2 h-4 w-4" />}
                            Scan Schedule
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <Card>
                <CardHeader>
                    <div>
                    <CardTitle>Class Schedule</CardTitle>
                    <CardDescription>
                        {selectedSection ? `Schedule for ${selectedSection.name}` : "Select a section to view its schedule"}
                    </CardDescription>
                </div>
                </CardHeader>
                <CardContent>
                    {isLoading && selectedSection ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : !selectedSection ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <CalendarIcon className="h-10 w-10 mb-2"/>
                            <p>No section selected.</p>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <p>No schedules found for this section.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-96">
                            <div className="space-y-2 pr-4">
                                {schedules.map(schedule => (
                                    <div key={schedule.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                        <div>
                                            <p className="font-medium">{schedule.subject}</p>
                                            <p className="text-sm text-muted-foreground">{schedule.startTime} - {schedule.endTime}</p>
                                            <p className="text-xs text-muted-foreground">{schedule.facultyName}</p>
                                        </div>
                                        <div>
                                            <Button variant="ghost" size="icon" onClick={() => openEditScheduleDialog(schedule)} className="mr-2">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)} className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Students in Section</CardTitle>
                    <CardDescription>
                         {selectedSection ? `Students assigned to ${selectedSection.name}` : "Select a section to view students"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading && selectedSection ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : !selectedSection ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <BookUser className="h-10 w-10 mb-2"/>
                            <p>No section selected.</p>
                        </div>
                    ) : studentsInSection.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <p>No students assigned to this section.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>RFID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsInSection.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell>{`${student.lastName}, ${student.firstName}`}</TableCell>
                                            <TableCell className="font-mono text-xs">{student.rfid || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>


      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSectionSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedSection?.id === 'new' ? 'Create Section' : 'Edit Section'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-1.5">
                  <Label htmlFor="name">Section Name</Label>
                  <Input id="name" value={selectedSection?.name || ''} onChange={(e) => setSelectedSection(s => s ? {...s, name: e.target.value} : null)} required />
              </div>
              <div className="grid gap-1.5">
                    <Label htmlFor="adviser">Adviser</Label>
                    <Select 
                        value={selectedSection?.adviserId} 
                        onValueChange={value => setSelectedSection(s => s ? {...s, adviserId: value, adviserName: faculty.find(f => f.id === value)?.name || ''} : null)} 
                        required
                    >
                        <SelectTrigger id="adviser"><SelectValue placeholder="Select adviser" /></SelectTrigger>
                        <SelectContent>
                            {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Section
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

       {/* Edit Schedule Dialog */}
      <Dialog open={isEditScheduleDialogOpen} onOpenChange={setIsEditScheduleDialogOpen}>
        <DialogContent>
          <form onSubmit={handleScheduleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
              <DialogDescription>For section: {selectedSection?.name}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-4 p-1">
                    <div className="grid gap-1.5">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" value={selectedSchedule?.subject || ''} onChange={e => setSelectedSchedule(s => s ? {...s, subject: e.target.value} : null)} required />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="faculty">Faculty (Optional)</Label>
                        <Select value={selectedSchedule?.facultyId || '__none__'} onValueChange={value => setSelectedSchedule(s => s ? {...s, facultyId: value} : null)}>
                            <SelectTrigger id="faculty"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" type="time" value={selectedSchedule?.startTime || ''} onChange={e => setSelectedSchedule(s => s ? {...s, startTime: e.target.value} : null)} required />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input id="endTime" type="time" value={selectedSchedule?.endTime || ''} onChange={e => setSelectedSchedule(s => s ? {...s, endTime: e.target.value} : null)} required />
                        </div>
                    </div>
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
                This will permanently delete the section "{selectedSection?.name}" and all its schedules. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleDeleteSection} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Review Dialog */}
      <Dialog open={isScanReviewDialogOpen} onOpenChange={setIsScanReviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review & Confirm Scanned Schedule</DialogTitle>
            <DialogDescription>
              AI has extracted the following schedule for section <span className="font-bold">{selectedSection?.name}</span>. Please review, correct, and assign faculty before saving.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] rounded-md border">
            <div className="p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Subject</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead className="w-1/3">Faculty (Optional)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedSchedules.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell>
                         <Input value={schedule.subject} onChange={(e) => handleScannedScheduleChange(index, 'subject', e.target.value)} />
                      </TableCell>
                      <TableCell>
                         <Input type="time" value={schedule.startTime} onChange={(e) => handleScannedScheduleChange(index, 'startTime', e.target.value)} />
                      </TableCell>
                      <TableCell>
                         <Input type="time" value={schedule.endTime} onChange={(e) => handleScannedScheduleChange(index, 'endTime', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Select value={schedule.facultyId || '__none__'} onValueChange={value => handleScannedScheduleChange(index, 'facultyId', value)} >
                            <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={() => setScannedSchedules([])} disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveScannedSchedules} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Schedules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
