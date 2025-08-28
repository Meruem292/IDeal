
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
import { Loader2, AlertCircle } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore"
import { format } from "date-fns"
import type { Student } from "@/lib/mock-data"

type RawScan = {
    id: string;
    timestamp: any; // Firestore Timestamp
    uid: string;
};

export default function StudentDashboardPage() {
    const [logs, setLogs] = useState<RawScan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setIsLoading(true);
                setError(null);
                let historyUnsubscribe: (() => void) | undefined;

                try {
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

                    const studentRfid = studentData.rfid.toUpperCase();

                    const q = query(
                        collection(db, "rfid_history"),
                        where("uid", "==", studentRfid),
                        orderBy("timestamp", "desc")
                    );

                    // Use onSnapshot for real-time updates
                    historyUnsubscribe = onSnapshot(q, (querySnapshot) => {
                        const rawScans: RawScan[] = [];
                        querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            rawScans.push({
                                id: doc.id,
                                uid: data.uid,
                                timestamp: data.timestamp,
                            });
                        });
                        setLogs(rawScans);
                        setIsLoading(false);
                    }, (err) => {
                        console.error("Error fetching attendance history: ", err);
                        setError(err.message || "Failed to fetch your attendance history.");
                        setIsLoading(false);
                    });

                } catch (err: any) {
                    console.error("Error setting up history listener: ", err);
                    setError(err.message || "Failed to set up history listener.");
                    setIsLoading(false);
                }
                
                return () => {
                    if (historyUnsubscribe) {
                        historyUnsubscribe();
                    }
                };

            } else {
                setIsLoading(false);
                setError("You must be logged in to view your dashboard.");
                setLogs([]);
            }
        });

        return () => authUnsubscribe();

    }, []);

  return (
    <DashboardLayout role="student">
      <Card>
        <CardHeader>
          <CardTitle>My Raw Scan History</CardTitle>
          <CardDescription>
            A direct log of all your RFID scan events, from newest to oldest.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive p-8 text-center">
                    <AlertCircle className="h-10 w-10 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Could Not Load Attendance</h2>
                    <p>{error}</p>
                </div>
            ) : logs.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Scan Timestamp</TableHead>
                    <TableHead>RFID Scanned</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.timestamp ? format(log.timestamp.toDate(), 'PPP p') : 'Invalid Date'}</TableCell>
                        <TableCell className="font-mono">{log.uid}</TableCell>
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
    </DashboardLayout>
  )
}
