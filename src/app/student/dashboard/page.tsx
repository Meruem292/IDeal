
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
import { Check, X, Clock, Loader2 } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { format } from "date-fns"

type AttendanceLog = {
    id: string;
    timestamp: any; // Firestore Timestamp
    type: 'time-in' | 'time-out';
};

type ProcessedAttendanceRecord = {
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    status: "Present" | "Absent"; // Simplified for this view
}


export default function StudentDashboardPage() {
    const [logs, setLogs] = useState<ProcessedAttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const q = query(collection(db, `students/${user.uid}/attendance`), orderBy("timestamp", "desc"));
                    const querySnapshot = await getDocs(q);
                    
                    const attendanceByDate: {[key: string]: {timeIn?: any, timeOut?: any}} = {};

                    querySnapshot.forEach(doc => {
                        const data = doc.data() as AttendanceLog;
                        const dateStr = format(data.timestamp.toDate(), 'yyyy-MM-dd');
                        
                        if (!attendanceByDate[dateStr]) {
                            attendanceByDate[dateStr] = {};
                        }

                        if (data.type === 'time-in') {
                           // If multiple time-ins for a day, take the earliest one
                           if (!attendanceByDate[dateStr].timeIn || data.timestamp.toMillis() < attendanceByDate[dateStr].timeIn.toMillis()) {
                                attendanceByDate[dateStr].timeIn = data.timestamp;
                           }
                        } else if (data.type === 'time-out') {
                            // If multiple time-outs for a day, take the latest one
                            if (!attendanceByDate[dateStr].timeOut || data.timestamp.toMillis() > attendanceByDate[dateStr].timeOut.toMillis()) {
                                attendanceByDate[dateStr].timeOut = data.timestamp;
                            }
                        }
                    });

                    const processedRecords: ProcessedAttendanceRecord[] = Object.entries(attendanceByDate)
                        .map(([date, times]) => ({
                            date: date,
                            timeIn: times.timeIn ? format(times.timeIn.toDate(), 'p') : null,
                            timeOut: times.timeOut ? format(times.timeOut.toDate(), 'p') : null,
                            status: times.timeIn ? "Present" : "Absent", // simplified logic
                        }))
                        .sort((a,b) => b.date.localeCompare(a.date)); // Sort descending by date string
                    
                    setLogs(processedRecords);

                } catch (err) {
                    console.error("Error fetching attendance history: ", err);
                    setError("Failed to fetch your attendance history.");
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

  const todayRecord = logs[0] || null;

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
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed p-8">
                <h2 className="text-xl font-semibold">Error</h2>
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
              A log of your recent attendance records.
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
                    <p>No attendance records found.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
