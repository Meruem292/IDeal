
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
import { Check, X, Clock, Loader2, AlertCircle } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { format } from "date-fns"
import type { Student } from "@/lib/mock-data"


type RawScan = {
    id: string;
    timestamp: any; // Firestore Timestamp
    uid: string;
};

type ProcessedAttendanceRecord = {
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    status: "Present" | "Absent"; 
}


export default function StudentDashboardPage() {
    const [logs, setLogs] = useState<ProcessedAttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setIsLoading(true);
                setError(null);
                try {
                    // 1. Get the student's RFID
                    const studentDocRef = doc(db, "students", user.uid);
                    const studentDoc = await getDoc(studentDocRef);

                    if (!studentDoc.exists()) {
                        throw new Error("Student profile not found.");
                    }
                    const studentData = studentDoc.data() as Student;
                    
                    if (!studentData.rfid) {
                        setError("You have not registered an RFID card. Please register one on your profile page.");
                        setLogs([]);
                        setIsLoading(false);
                        return;
                    }

                    // 2. Query rfid_history with the student's RFID (ensuring uppercase comparison)
                    const q = query(
                        collection(db, "rfid_history"), 
                        where("uid", "==", studentData.rfid.toUpperCase()),
                        orderBy("timestamp", "desc")
                    );
                    const querySnapshot = await getDocs(q);
                    
                    const attendanceByDate: {[key: string]: {scans: any[]}} = {};

                    // Group scans by date
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        const dateStr = format(data.timestamp.toDate(), 'yyyy-MM-dd');
                        
                        if (!attendanceByDate[dateStr]) {
                            attendanceByDate[dateStr] = { scans: [] };
                        }
                        attendanceByDate[dateStr].scans.push(data.timestamp);
                    });

                    // 3. Process the grouped scans
                    const processedRecords: ProcessedAttendanceRecord[] = Object.entries(attendanceByDate)
                        .map(([date, {scans}]) => {
                             if (scans.length === 0) {
                                return null;
                            }
                            // Sort scans to find the earliest (timeIn) and latest (timeOut)
                            scans.sort((a, b) => a.toMillis() - b.toMillis());
                            
                            const timeIn = scans[0];
                            const timeOut = scans.length > 1 ? scans[scans.length - 1] : null;

                            return {
                                date: date,
                                timeIn: timeIn ? format(timeIn.toDate(), 'p') : null,
                                timeOut: timeOut ? format(timeOut.toDate(), 'p') : null,
                                status: "Present",
                            };
                        })
                        .filter((record): record is ProcessedAttendanceRecord => record !== null)
                        .sort((a,b) => b.date.localeCompare(a.date)); // Sort by date descending

                    setLogs(processedRecords);

                } catch (err: any) {
                    console.error("Error fetching attendance history: ", err);
                    setError(err.message || "Failed to fetch your attendance history.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
                setError("You must be logged in to view your dashboard.");
            }
        });

        return () => unsubscribe();

    }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = logs.find(log => log.date === todayStr) || null;

  if (isLoading) {
    return (
        <DashboardLayout role="student">
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </DashboardLayout>
    )
  }

  if (error) {
     return (
        <DashboardLayout role="student">
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive p-8 text-center">
                <AlertCircle className="h-10 w-10 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Could Not Load Attendance</h2>
                <p>{error}</p>
            </div>
        </DashboardLayout>
    )
  }


  return (
    <DashboardLayout role="student">
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Today's Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                 {todayRecord ? (
                    todayRecord.status === "Present" ? (
                      <Check className="text-green-500" />
                    ) : (
                      <X className="text-red-500" />
                    )
                ) : <X className="text-red-500" />}
                {todayRecord?.status || "Absent"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Time In</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-blue-500" />
                {todayRecord?.timeIn || "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Time Out</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-purple-500" />
                {todayRecord?.timeOut || "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>My Attendance History</CardTitle>
            <CardDescription>
              A log of your recent attendance records from RFID scans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((record) => (
                    <TableRow key={record.date}>
                        <TableCell className="font-medium">{format(new Date(record.date), 'PPP')}</TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            record.status === "Present"
                                ? "default"
                                : "destructive"
                            }
                            className={record.status === 'Present' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'}
                        >
                            {record.status}
                        </Badge>
                        </TableCell>
                        <TableCell>{record.timeIn || "---"}</TableCell>
                        <TableCell>{record.timeOut || "---"}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <p>No attendance records found for your RFID.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
