
"use client"
import { useState, useEffect, useMemo } from "react"
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
import { Loader2, Trash2, Edit, PlusCircle, Calendar as CalendarIcon } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, writeBatch } from "firebase/firestore"
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
    dayOfWeek: string
    startTime: string
    endTime: string
    facultyId: string
    facultyName?: string
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ManageSectionsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [currentSectionForSchedule, setCurrentSectionForSchedule] = useState<Section | null>(null);

  const { toast } = useToast()

  const fetchSectionsAndFaculty = async () => {
    setIsLoading(true)
    try {
      const sectionsSnapshot = await getDocs(collection(db, "sections"))
      const sectionsList = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section))
      setSections(sectionsList)

      const facultySnapshot = await getDocs(collection(db, "faculty"))
      const facultyList = facultySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Faculty))
      setFaculty(facultyList)

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error fetching data", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchedules = async (sectionId: string) => {
    setIsLoading(true);
    try {
        const schedulesSnapshot = await getDocs(collection(db, `sections/${sectionId}/schedules`));
        let schedulesList = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
        
        schedulesList = schedulesList.map(schedule => ({
            ...schedule,
            facultyName: faculty.find(f => f.id === schedule.facultyId)?.name || 'N/A'
        }));
        
        setSchedules(schedulesList);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error fetching schedules", description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSectionsAndFaculty()
  }, [])
  
  useEffect(() => {
    if (selectedSection) {
        fetchSchedules(selectedSection.id);
    } else {
        setSchedules([]);
    }
  }, [selectedSection, faculty]);

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
      fetchSectionsAndFaculty()
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error saving section", description: error.message })
    } finally {
      setIsProcessing(false)
      setIsSectionDialogOpen(false)
      setSelectedSection(null)
    }
  }
  
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !currentSectionForSchedule) return;
    setIsProcessing(true);

    const { id, facultyName, ...scheduleData } = selectedSchedule;

    try {
        const schedulePath = `sections/${currentSectionForSchedule.id}/schedules`;
        if (id === 'new') {
            await addDoc(collection(db, schedulePath), scheduleData);
            toast({ title: "Schedule Created" });
        } else {
            await updateDoc(doc(db, schedulePath, id), scheduleData);
            toast({ title: "Schedule Updated" });
        }
        fetchSchedules(currentSectionForSchedule.id);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error saving schedule", description: error.message });
    } finally {
        setIsProcessing(false);
        setIsScheduleDialogOpen(false);
        setSelectedSchedule(null);
        setCurrentSectionForSchedule(null);
    }
  };


  const handleDeleteSection = async () => {
    if (!selectedSection) return
    setIsProcessing(true)
    try {
      // Note: This doesn't un-assign students from the deleted section.
      // A more robust solution might involve a cloud function.
      const batch = writeBatch(db);
      const schedulesSnapshot = await getDocs(collection(db, `sections/${selectedSection.id}/schedules`));
      schedulesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, "sections", selectedSection.id));
      await batch.commit();

      toast({ title: "Section Deleted", description: `Section ${selectedSection.name} has been deleted.` })
      fetchSectionsAndFaculty()
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

  const openScheduleDialog = (section: Section, schedule?: Schedule) => {
    setCurrentSectionForSchedule(section);
    setSelectedSchedule(schedule || { id: 'new', subject: '', dayOfWeek: '', startTime: '', endTime: '', facultyId: '' });
    setIsScheduleDialogOpen(true);
  };

  const openDeleteDialog = (section: Section) => {
    setSelectedSection(section)
    setIsDeleteDialogOpen(true)
  }
  
  const schedulesByDay = useMemo(() => {
    return schedules.reduce((acc, schedule) => {
        (acc[schedule.dayOfWeek] = acc[schedule.dayOfWeek] || []).push(schedule);
        return acc;
    }, {} as Record<string, Schedule[]>);
  }, [schedules]);

  return (
    <DashboardLayout role="admin">
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
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

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle>Class Schedule</CardTitle>
                        <CardDescription>
                            {selectedSection ? `Schedule for ${selectedSection.name}` : "Select a section to view its schedule"}
                        </CardDescription>
                    </div>
                     <Button onClick={() => openScheduleDialog(selectedSection!)} disabled={!selectedSection}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Schedule
                    </Button>
                </CardHeader>
                <CardContent>
                   {isLoading && selectedSection ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                   ) : !selectedSection ? (
                       <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <CalendarIcon className="h-10 w-10 mb-2"/>
                            <p>No section selected.</p>
                       </div>
                   ) : Object.keys(schedulesByDay).length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <p>No schedules found for this section.</p>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           {daysOfWeek.filter(day => schedulesByDay[day]).map(day => (
                               <div key={day}>
                                   <h4 className="font-semibold text-primary mb-2">{day}</h4>
                                   <div className="space-y-2">
                                        {schedulesByDay[day].map(schedule => (
                                            <div key={schedule.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                                                <div>
                                                    <p className="font-medium">{schedule.subject}</p>
                                                    <p className="text-sm text-muted-foreground">{schedule.startTime} - {schedule.endTime}</p>
                                                    <p className="text-xs text-muted-foreground">{schedule.facultyName}</p>
                                                </div>
                                                <div>
                                                     <Button variant="ghost" size="icon" onClick={() => openScheduleDialog(selectedSection, schedule)} className="mr-2">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)} className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                   </div>
                               </div>
                           ))}
                       </div>
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
                        onValueChange={value => setSelectedSection(s => s ? {...s, adviserId: value} : null)} 
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

       {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setCurrentSectionForSchedule(null);
                setSelectedSchedule(null);
            }
            setIsScheduleDialogOpen(isOpen);
        }}>
        <DialogContent>
          <form onSubmit={handleScheduleSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedSchedule?.id === 'new' ? 'Create Schedule' : 'Edit Schedule'}</DialogTitle>
              <DialogDescription>For section: {currentSectionForSchedule?.name}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={selectedSchedule?.subject || ''} onChange={e => setSelectedSchedule(s => s ? {...s, subject: e.target.value} : null)} required />
                </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select value={selectedSchedule?.facultyId} onValueChange={value => setSelectedSchedule(s => s ? {...s, facultyId: value} : null)} required>
                        <SelectTrigger id="faculty"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                        <SelectContent>
                            {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select value={selectedSchedule?.dayOfWeek} onValueChange={value => setSelectedSchedule(s => s ? {...s, dayOfWeek: value} : null)} required>
                        <SelectTrigger id="dayOfWeek"><SelectValue placeholder="Select day" /></SelectTrigger>
                        <SelectContent>
                           {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
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
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Schedule
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
    </DashboardLayout>
  )
}
