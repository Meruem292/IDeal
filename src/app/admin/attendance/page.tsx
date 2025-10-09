
"use client"
import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import type { Student } from "@/lib/mock-data"
import { format } from 'date-fns';

type AttendanceLog = {
    id: string;
    studentName: string;
    rfid: string;
    time: string;
};

const formatScanTime = (time: string) => {
    try {
        const date = new Date(time);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return format(date, 'Pp');
    } catch (e) {
        return 'Invalid Date';
    }
};


export default function AttendancePage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ROWS_PER_PAGE = 10;

    useEffect(() => {
        const fetchAttendance = async () => {
            setIsLoading(true);
            try {
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const rfidToStudentMap = new Map<string, string>();
                studentsSnapshot.forEach(doc => {
                    const student = doc.data() as Student;
                    if (student.rfid) {
                        rfidToStudentMap.set(student.rfid.toUpperCase(), `${student.firstName} ${student.lastName}`);
                    }
                });

                const historyQuery = query(collection(db, 'rfid_history'));
                const historySnapshot = await getDocs(historyQuery);
                
                let attendanceList: AttendanceLog[] = [];
                historySnapshot.forEach(doc => {
                    const data = doc.data();
                    const studentName = rfidToStudentMap.get(data.uid.toUpperCase()) || 'Unknown Student';

                    attendanceList.push({
                        id: doc.id,
                        studentName: studentName,
                        rfid: data.uid,
                        time: data.time,
                    });
                });

                attendanceList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

                setLogs(attendanceList);

            } catch (error: any) {
                 if (error.message.includes("requires an index")) {
                    console.error("Firestore index required. Please check the Firebase console for the link to create it.", error);
                } else {
                    console.error("Error fetching attendance logs: ", error);
                }
            } finally {
                setIsLoading(false);
            }
        }
        fetchAttendance();
    }, []);

    const totalPages = Math.ceil(logs.length / ROWS_PER_PAGE);
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        return logs.slice(startIndex, endIndex);
    }, [logs, currentPage]);

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
                                {paginatedLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.studentName}</TableCell>
                                        <TableCell>{log.rfid}</TableCell>
                                        <TableCell>{formatScanTime(log.time)}</TableCell>
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
        </DashboardLayout>
    )
}
