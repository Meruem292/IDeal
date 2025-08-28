
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
    time: string; // The Unix timestamp as a string
    uid: string;
};

// Helper to convert string unix time to a readable format
const formatScanTime = (timeStr: string) => {
    try {
        const timestamp = parseInt(timeStr, 10);
        // Firestore uses seconds for Unix time, so multiply by 1000 for JS Date
        return format(new Date(timestamp * 1000), 'PPP p');
    } catch (e) {
        console.error("Invalid time format:", timeStr, e);
        return "Invalid Date";
    }
};


export default function StudentDashboardPage() {
    const [logs, setLogs] = useState<RawScan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const authUnsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                const studentDocRef = doc(db, "students", user.uid);
                
                const getHistory = async () => {
                    setIsLoading(true);
                    setError(null);
                    let historyUnsubscribe: (() => void) | undefined;
                    
                    try {
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

                        // Corrected query: using 'time' field for ordering as seen in screenshot
                        const q = query(
                            collection(db, "rfid_history"),
                            where("uid", "==", studentRfid),
                            orderBy("time", "desc")
                        );

                        historyUnsubscribe = onSnapshot(q, (querySnapshot) => {
                            const rawScans: RawScan[] = [];
                            querySnapshot.forEach((doc) => {
                                const data = doc.data();
                                rawScans.push({
                                    id: doc.id,
                                    uid: data.uid,
                                    time: data.time,
                                });
                            });
                            setLogs(rawScans);
                            setIsLoading(false);
                        }, (err) => {
                            console.error("Error fetching attendance history: ", err);
                            // This might indicate a missing index if 'time' field is also used for sorting
                            if (err.message.includes("requires an index")) {
                                setError("The database query requires a new index. Please check the developer console for a link to create it in Firebase.");
                            } else {
                                setError(err.message || "Failed to fetch your attendance history.");
                            }
                            setIsLoading(false);
                        });

                    } catch (err: any) {
                        console.error("Error setting up history listener: ", err);
                        setError(err.message || "An error occurred while fetching your data.");
                        setIsLoading(false);
                    }

                    // Cleanup on unmount
                    return () => {
                        if (historyUnsubscribe) {
                            historyUnsubscribe();
                        }
                    };
                };

                getHistory();

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
                    <h2 className="text-xl font-semibold mb-2">Could Not Load History</h2>
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
                        <TableCell className="font-medium">{formatScanTime(log.time)}</TableCell>
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
