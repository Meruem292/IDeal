
"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Link from "next/link"
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
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar as CalendarIcon, BookUser, AlertCircle } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, doc, query, where, collectionGroup } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
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

export default function FacultyManageSectionsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentsInSection, setStudentsInSection] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    const fetchFacultyData = async () => {
        setIsLoading(true);
        setError(null);
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setError("You must be logged in to view this page.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Fetch all faculty to map names later
            const facultySnapshot = await getDocs(collection(db, "faculty"));
            const facultyList = facultySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Faculty));
            setFaculty(facultyList);

            // 2. Fetch all students
            const studentsSnapshot = await getDocs(collection(db, "students"));
            const studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
            setAllStudents(studentList);

            // 3. Find sections where the current faculty is the adviser
            const advisedSectionsQuery = query(collection(db, "sections"), where("adviserId", "==", currentUser.uid));
            const advisedSectionsSnapshot = await getDocs(advisedSectionsQuery);
            const advisedSections = advisedSectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));

            // 4. Find sections where the current faculty teaches a subject
            const taughtSchedulesQuery = query(collectionGroup(db, 'schedules'), where('facultyId', '==', currentUser.uid));
            const taughtSchedulesSnapshot = await getDocs(taughtSchedulesQuery);
            const taughtSectionIds = new Set(taughtSchedulesSnapshot.docs.map(doc => doc.ref.parent.parent!.id));

            // 5. Fetch the full section documents for taught sections
            let taughtSections: Section[] = [];
            if (taughtSectionIds.size > 0) {
                 const taughtSectionsQuery = query(collection(db, "sections"), where("__name__", "in", Array.from(taughtSectionIds)));
                 const taughtSectionsDocs = await getDocs(taughtSectionsQuery);
                 taughtSections = taughtSectionsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
            }
           
            // 6. Combine and deduplicate the lists
            const combinedSections = [...advisedSections, ...taughtSections];
            const uniqueSections = Array.from(new Map(combinedSections.map(s => [s.id, s])).values());
            
            setSections(uniqueSections.sort((a,b) => a.name.localeCompare(b.name)));

        } catch (err: any) {
            console.error("Error fetching faculty data:", err);
            toast({ variant: "destructive", title: "Error fetching data", description: err.message });
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchFacultyData();
      } else {
        setIsLoading(false);
        setError("User not authenticated.");
      }
    });

    return () => unsubscribe();
  }, [toast]);

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


  if (isLoading) {
    return (
        <DashboardLayout role="faculty">
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </DashboardLayout>
    );
  }

  if (error) {
    return (
        <DashboardLayout role="faculty">
            <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive p-8 text-center">
                <AlertCircle className="h-10 w-10 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Could Not Load Data</h2>
                <p>{error}</p>
            </div>
        </DashboardLayout>
    );
  }


  return (
    <DashboardLayout role="faculty">
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>My Sections</CardTitle>
                    <CardDescription>
                        Sections you advise or teach in. Click a section to see details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                {sections.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">No sections assigned to you.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Section Name</TableHead>
                            <TableHead>Adviser</TableHead>
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
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Class Schedule</CardTitle>
                    <CardDescription>
                        {selectedSection ? `Schedule for ${selectedSection.name}` : "Select a section to view its schedule"}
                    </CardDescription>
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
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="mt-6">
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
                                        <TableHead>Email</TableHead>
                                        <TableHead>RFID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsInSection.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell>{`${student.lastName}, ${student.firstName}`}</TableCell>
                                            <TableCell>{student.email}</TableCell>
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
    </DashboardLayout>
  )
}
