
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
import { Badge } from "@/components/ui/badge"
import { Student } from "@/lib/mock-data"
import { Fingerprint, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsList.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching students",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [toast]);


  const getFullName = (student: Student) => {
    return `${student.lastName}, ${student.firstName} ${student.middleName || ""}`.replace(/\s+/g, ' ').trim();
  };


  return (
    <DashboardLayout role="faculty">
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            A list of all students in the system.
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
                        <TableHead>Gender</TableHead>
                        <TableHead>RFID Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.map((student) => (
                        <TableRow key={student.id}>
                        <TableCell className="font-medium">{getFullName(student)}</TableCell>
                        <TableCell>{student.email}</TableCell>
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
