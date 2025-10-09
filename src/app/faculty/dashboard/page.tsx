
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useFirestore } from "@/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { format, startOfDay, endOfDay } from "date-fns"
import type { Student } from "@/lib/mock-data"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

type EnrichedAttendanceRecord = {
  id: string
  studentName: string
  studentId: string
  status: "Present" | "Absent"
  timeIn: string | null
}

function AttendanceTable({ records }: { records: EnrichedAttendanceRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No records to display.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Name</TableHead>
          <TableHead>Student ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time In</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">{record.studentName}</TableCell>
            <TableCell>{record.studentId}</TableCell>
            <TableCell>
              <Badge
                variant={record.status === "Present" ? "default" : "destructive"}
                className={record.status === 'Present' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'}
              >
                {record.status}
              </Badge>
            </TableCell>
            <TableCell>{record.timeIn || "---"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function FacultyDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<EnrichedAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      const studentsRef = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: studentsRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        return null;
      });

      if (!studentsSnapshot) {
        setIsLoading(false);
        return;
      }
      
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentsList);

      const todayStart = format(startOfDay(new Date()), "yyyy-MM-dd HH:mm:ss");
      const todayEnd = format(endOfDay(new Date()), "yyyy-MM-dd HH:mm:ss");

      const historyQuery = query(
        collection(db, "rfid_history"),
        where("time", ">=", todayStart),
        where("time", "<=", todayEnd)
      );

      const historySnapshot = await getDocs(historyQuery).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'rfid_history',
            operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
        return null;
      });

      if(!historySnapshot) {
        setIsLoading(false);
        return;
      }

      const todaysScans = new Map<string, { time: string, docId: string }>();
      historySnapshot.forEach(doc => {
        const data = doc.data();
        const rfid = data.uid.toUpperCase();
        if (!todaysScans.has(rfid)) {
          todaysScans.set(rfid, { time: data.time, docId: doc.id });
        }
      });

      const attendanceList: EnrichedAttendanceRecord[] = studentsList.map(student => {
        const studentRfid = student.rfid?.toUpperCase();
        const scan = studentRfid ? todaysScans.get(studentRfid) : undefined;

        if (scan) {
          return {
            id: student.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            status: "Present",
            timeIn: format(new Date(scan.time), "p"),
          };
        } else {
          return {
            id: student.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            status: "Absent",
            timeIn: null,
          };
        }
      });
      
      setAttendance(attendanceList);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [db]);

  const presentStudents = attendance.filter(r => r.status === 'Present');
  const absentStudents = attendance.filter(r => r.status === 'Absent');

  if (isLoading) {
      return (
          <DashboardLayout role="faculty">
              <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
          </DashboardLayout>
      );
  }

  return (
    <DashboardLayout role="faculty">
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total Students</CardDescription>
              <CardTitle>{students.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Present Today</CardDescription>
              <CardTitle className="text-green-600">{presentStudents.length}</CardTitle>
            </CardHeader>
          </Card>
           <Card>
            <CardHeader>
              <CardDescription>Absent Today</CardDescription>
              <CardTitle className="text-red-600">{absentStudents.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
            <CardDescription>
              View and manage student attendance records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today">
              <TabsList>
                <TabsTrigger value="today">Today's Attendance</TabsTrigger>
                <TabsTrigger value="present">Present</TabsTrigger>
                <TabsTrigger value="absent">Absent</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="mt-4">
                <AttendanceTable records={attendance} />
              </TabsContent>
              <TabsContent value="present" className="mt-4">
                <AttendanceTable records={presentStudents} />
              </TabsContent>
              <TabsContent value="absent" className="mt-4">
                 <AttendanceTable records={absentStudents} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
