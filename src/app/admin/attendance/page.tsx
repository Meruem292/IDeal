
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
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import type { Student } from "@/lib/mock-data"
import { format } from 'date-fns';

type AttendanceLog = {
    id: string;
    studentName: string;
    rfid: string;
    timestamp: any; // Firestore Timestamp
};


export default function AttendancePage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all students to create a map from RFID to Student Name
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const rfidToStudentMap = new Map<string, string>();
                studentsSnapshot.forEach(doc => {
                    const student = doc.data() as Student;
                    if (student.rfid) {
                        rfidToStudentMap.set(student.rfid, `${student.firstName} ${student.lastName}`);
                    }
                });

                // 2. Fetch all attendance records from the rfid_history collection
                const historyQuery = query(collection(db, 'rfid_history'), orderBy('timestamp', 'desc'));
                const historySnapshot = await getDocs(historyQuery);
                
                const attendanceList: AttendanceLog[] = [];
                historySnapshot.forEach(doc => {
                    const data = doc.data();
                    // Use the UID from the scan to find the student's name
                    const studentName = rfidToStudentMap.get(data.uid) || 'Unknown Student';

                    attendanceList.push({
                        id: doc.id,
                        studentName: studentName,
                        rfid: data.uid,
                        timestamp: data.timestamp,
                    });
                });

                setLogs(attendanceList);

            } catch (error) {
                console.error("Error fetching attendance logs: ", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAttendance();
    }, []);

    return (
        <DashboardLayout role="admin">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Log</CardTitle>
                    <CardDescription>
                        A real-time log of all RFID scans from the central history.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : logs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>RFID</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.studentName}</TableCell>
                                        <TableCell>{log.rfid}</TableCell>
                                        <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'Pp') : 'Invalid Date'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                            <p>No attendance records found in the system.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    )
}
