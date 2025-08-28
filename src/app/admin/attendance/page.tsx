
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
import { collection, getDocs, doc, collectionGroup, orderBy, query } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import type { Student } from "@/lib/mock-data"
import { format } from 'date-fns';

type AttendanceLog = {
    id: string;
    studentId: string;
    studentName: string;
    rfid: string;
    timestamp: any; // Firestore Timestamp
    type: 'time-in' | 'time-out';
};


export default function AttendancePage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all students to map IDs to names
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const studentMap = new Map<string, {name: string, rfid: string}>();
                studentsSnapshot.forEach(doc => {
                    const student = doc.data() as Student;
                    studentMap.set(doc.id, { 
                        name: `${student.firstName} ${student.lastName}`,
                        rfid: student.rfid || 'N/A'
                    });
                });

                // 2. Fetch all attendance records from the collection group
                const attendanceQuery = query(collectionGroup(db, 'attendance'), orderBy('timestamp', 'desc'));
                const attendanceSnapshot = await getDocs(attendanceQuery);
                
                const attendanceList: AttendanceLog[] = [];
                attendanceSnapshot.forEach(doc => {
                    const data = doc.data();
                    const studentId = doc.ref.parent.parent?.id || '';
                    const studentInfo = studentMap.get(studentId);

                    if (studentInfo) {
                        attendanceList.push({
                            id: doc.id,
                            studentId,
                            studentName: studentInfo.name,
                            rfid: studentInfo.rfid,
                            timestamp: data.timestamp,
                            type: data.type
                        });
                    }
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
                        A real-time log of all RFID scans.
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
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>RFID</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.studentName}</TableCell>
                                        <TableCell>{log.rfid}</TableCell>
                                        <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'Pp') : 'Invalid Date'}</TableCell>
                                        <TableCell className="capitalize">{log.type}</TableCell>
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
