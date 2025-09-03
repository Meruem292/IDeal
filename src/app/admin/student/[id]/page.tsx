
"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import type { Student } from "@/lib/mock-data"
import { format } from "date-fns"

type RawScan = {
    id: string;
    time: string; // The date string from Firestore
    uid: string;
};

const parseScanDate = (time: string): Date | null => {
    try {
        const date = new Date(time.replace(' ', 'T')); // Make it ISO-like
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        return null;
    }
};

export default function StudentProfilePage() {
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [attendedDays, setAttendedDays] = useState<Date[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) {
            setError("No student ID provided.");
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Fetch student data
                const studentDocRef = doc(db, "students", studentId);
                const studentDoc = await getDoc(studentDocRef);

                if (!studentDoc.exists()) {
                    throw new Error("Student profile not found.");
                }
                const studentData = studentDoc.data() as Student;
                setStudent(studentData);

                // 2. Fetch attendance data if RFID exists
                if (studentData.rfid) {
                    const studentRfid = studentData.rfid.toUpperCase();
                    const historyQuery = query(
                        collection(db, "rfid_history"),
                        where("uid", "==", studentRfid)
                    );
                    const historySnapshot = await getDocs(historyQuery);
                    
                    const uniqueDays = new Set<string>();
                    historySnapshot.forEach((doc) => {
                        const data = doc.data() as RawScan;
                        const scanDate = parseScanDate(data.time);
                        if (scanDate) {
                            // Normalize to the start of the day to get unique days
                            uniqueDays.add(format(scanDate, "yyyy-MM-dd"));
                        }
                    });
                    
                    const attendedDates = Array.from(uniqueDays).map(dayStr => new Date(dayStr));
                    setAttendedDays(attendedDates);
                }
            } catch (err: any) {
                console.error("Error fetching student data:", err);
                setError(err.message || "An error occurred while fetching data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    if (isLoading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="admin">
                <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive p-8 text-center">
                    <AlertCircle className="h-10 w-10 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Could Not Load Profile</h2>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );
    }
    
    if (!student) {
        return <DashboardLayout role="admin"><p>Student not found.</p></DashboardLayout>;
    }

    return (
        <DashboardLayout role="admin">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>{`${student.firstName} ${student.lastName}`}</CardTitle>
                        <CardDescription>Student Profile</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <p className="font-medium">{student.email}</p>
                        </div>
                         <div className="space-y-1">
                            <Label>Student ID</Label>
                            <p className="font-mono text-xs">{student.id}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>RFID</Label>
                            <p className="font-mono text-sm">{student.rfid || "Not Registered"}</p>
                        </div>
                         <div className="space-y-1">
                            <Label>Address</Label>
                            <p className="text-sm">{student.address}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Gender</Label>
                            <p className="text-sm">{student.gender}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Birthday</Label>
                            <p className="text-sm">{new Date(student.birthday).toLocaleDateString()}</p>
                        </div>
                         <div className="space-y-1 pt-4">
                            <Label className="font-semibold text-primary">Guardian Information</Label>
                            <p className="text-sm"><span className="font-medium">{student.guardian.name}</span> ({student.guardian.relationship})</p>
                            <p className="text-sm text-muted-foreground">{student.guardian.contactNumber}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Attendance Calendar</CardTitle>
                        <CardDescription>
                            Days with a green background indicate at least one scan was recorded.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="multiple"
                            selected={attendedDays}
                            defaultMonth={new Date()}
                            className="p-0"
                            classNames={{
                                day_selected: "bg-green-200/50 text-green-800 hover:bg-green-200/70 focus:bg-green-200/70",
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

