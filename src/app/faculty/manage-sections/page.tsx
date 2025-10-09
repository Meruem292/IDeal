
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
import { Loader2, AlertCircle, Eye } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, doc, query, where, collectionGroup } from "firebase/firestore"
import { Button } from "@/components/ui/button"

type Section = {
  id: string
  name: string
  adviserName: string
  handledSubjects: string
}

export default function FacultyManageSectionsPage() {
  const [handledSections, setHandledSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);
  
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
            // Find sections where the current faculty teaches a subject
            const taughtSchedulesQuery = query(collectionGroup(db, 'schedules'), where('facultyId', '==', currentUser.uid));
            const taughtSchedulesSnapshot = await getDocs(taughtSchedulesQuery);
            
            const taughtSectionIds = new Set<string>();
            const subjectsBySection = new Map<string, string[]>();

            taughtSchedulesSnapshot.forEach(doc => {
                const sectionId = doc.ref.parent.parent!.id;
                const subject = doc.data().subject;
                taughtSectionIds.add(sectionId);
                
                if (!subjectsBySection.has(sectionId)) {
                    subjectsBySection.set(sectionId, []);
                }
                subjectsBySection.get(sectionId)!.push(subject);
            });

            // Fetch the full section documents for taught sections
            let taughtSections: Section[] = [];
            if (taughtSectionIds.size > 0) {
                 const taughtSectionsQuery = query(collection(db, "sections"), where("__name__", "in", Array.from(taughtSectionIds)));
                 const taughtSectionsDocs = await getDocs(taughtSectionsQuery);
                 taughtSections = taughtSectionsDocs.docs.map(doc => {
                    const sectionData = doc.data();
                    const subjects = subjectsBySection.get(doc.id) || [];
                    return { 
                        id: doc.id, 
                        name: sectionData.name,
                        adviserName: sectionData.adviserName,
                        handledSubjects: subjects.join(', ')
                    } as Section
                 });
            }
           
            setHandledSections(taughtSections.sort((a,b) => a.name.localeCompare(b.name)));

        } catch (err: any) {
            console.error("Error fetching faculty data:", err);
            if (err.message.includes("requires a COLLECTION_GROUP_ASC index")) {
                setError("A database index is required. The developer has been notified to create it.");
                 toast({ variant: "destructive", title: "Database Index Required", description: "Please ask the developer to create the necessary Firestore index.", duration: 10000 });
            } else {
                toast({ variant: "destructive", title: "Error fetching data", description: err.message });
                setError(err.message);
            }
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
        <Card>
            <CardHeader>
                <CardTitle>My Handled Sections</CardTitle>
                <CardDescription>
                    Select a section to view its attendance sheet.
                </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : handledSections.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">You are not assigned to teach in any sections.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Section Name</TableHead>
                        <TableHead>Adviser</TableHead>
                        <TableHead>Handled Subject(s)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {handledSections.map((section) => (
                        <TableRow key={section.id}>
                            <TableCell className="font-medium">{section.name}</TableCell>
                            <TableCell>{section.adviserName}</TableCell>
                            <TableCell className="text-muted-foreground">{section.handledSubjects}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/faculty/sections/${section.id}`}>
                                        <Eye className="mr-2 h-4 w-4"/>
                                        View Attendance
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            </CardContent>
        </Card>
    </DashboardLayout>
  )
}
