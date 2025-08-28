
"use client"
import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ScanLine } from "lucide-react"
import { db } from "@/lib/firebase"
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp,
    limit,
    orderBy,
    startOfDay,
    endOfDay,
    Timestamp
} from "firebase/firestore"

export default function ScannerPage() {
    const [rfid, setRfid] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [lastScan, setLastScan] = useState<{name: string, rfid: string, type: 'time-in' | 'time-out', time: string} | null>(null);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rfid) return;
        setIsLoading(true);

        try {
            // 1. Find the student with this RFID
            const q = query(collection(db, "students"), where("rfid", "==", rfid.trim().toUpperCase()), limit(1));
            const studentSnapshot = await getDocs(q);

            if (studentSnapshot.empty) {
                throw new Error("No student found with this RFID.");
            }

            const studentDoc = studentSnapshot.docs[0];
            const studentId = studentDoc.id;
            const studentName = `${studentDoc.data().firstName} ${studentDoc.data().lastName}`;
            
            // 2. Check for today's attendance to determine if it's time-in or time-out
            const today = new Date();
            const startOfToday = startOfDay(today);
            const endOfToday = endOfDay(today);

            const attendanceCollectionRef = collection(db, `students/${studentId}/attendance`);
            const attendanceQuery = query(
                attendanceCollectionRef, 
                where('timestamp', '>=', startOfToday),
                where('timestamp', '<=', endOfToday),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            
            const attendanceSnapshot = await getDocs(attendanceQuery);

            let scanType: 'time-in' | 'time-out' = 'time-in'; // Default to time-in

            if (!attendanceSnapshot.empty) {
                const lastScan = attendanceSnapshot.docs[0].data();
                if (lastScan.type === 'time-in') {
                    scanType = 'time-out';
                }
            }

            // 3. Add the new attendance record
            const newRecord = await addDoc(attendanceCollectionRef, {
                type: scanType,
                timestamp: serverTimestamp()
            });
            
            const currentTime = new Date().toLocaleTimeString();
            setLastScan({ name: studentName, rfid, type: scanType, time: currentTime });
            toast({
                title: "Scan Successful",
                description: `${studentName} has successfully timed ${scanType.includes('in') ? 'in' : 'out'} at ${currentTime}.`
            });
            setRfid("");

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Scan Failed",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <DashboardLayout role="admin">
           <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <form onSubmit={handleScan}>
                    <CardHeader>
                    <CardTitle>RFID Scanner</CardTitle>
                    <CardDescription>
                        Simulate scanning an RFID card by entering its UID below.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="rfid">RFID UID</Label>
                        <Input
                        type="text"
                        id="rfid"
                        placeholder="e.g., 766EF94D"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="font-mono"
                        autoFocus
                        />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                        Process Scan
                    </Button>
                    </CardFooter>
                </form>
            </Card>
            {lastScan && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Last Successful Scan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                       <p><span className="font-medium text-muted-foreground">Student:</span> {lastScan.name}</p>
                       <p><span className="font-medium text-muted-foreground">RFID:</span> <span className="font-mono">{lastScan.rfid}</span></p>
                       <p><span className="font-medium text-muted-foreground">Time:</span> {lastScan.time}</p>
                       <p><span className="font-medium text-muted-foreground">Type:</span> <span className="capitalize">{lastScan.type}</span></p>
                    </CardContent>
                </Card>
            )}
           </div>
        </DashboardLayout>
    )
}
