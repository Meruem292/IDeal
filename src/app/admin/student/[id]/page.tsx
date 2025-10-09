
"use client"
import { useState, useEffect, useMemo } from "react"
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
import { Loader2, AlertCircle, CalendarClock, BookOpen } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import type { Student } from "@/lib/mock-data"
import { format, isSameDay } from "date-fns"

type RawScan = {
    id: string;
    time: string; // The date string from Firestore
    uid: string;
    classScheduleId?: string;
    sectionId?: string;
};

type ScheduleInfo = {
    subject: string;
    startTime: string;
    endTime: string;
}

type DailyAttendance = {
    time: string;
    subject: string;
}

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
    const [allScans, setAllScans] = useState<RawScan[]>([]);
    const [scheduleMap, setScheduleMap] = useState<Map<string, ScheduleInfo>>(new Map());
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
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

                // 2. Fetch all schedules to create a lookup map
                const tempScheduleMap = new Map<string, ScheduleInfo>();
                const sectionsSnapshot = await getDocs(collection(db, "sections"));
                for (const sectionDoc of sectionsSnapshot.docs) {
                    const schedulesSnapshot = await getDocs(collection(db, `sections/${sectionDoc.id}/schedules`));
                    schedulesSnapshot.forEach(scheduleDoc => {
                        const scheduleData = scheduleDoc.data();
                        tempScheduleMap.set(scheduleDoc.id, {
                            subject: scheduleData.subject,
                            startTime: scheduleData.startTime,
                            endTime: scheduleData.endTime
                        });
                    });
                }
                setScheduleMap(tempScheduleMap);

                // 3. Fetch attendance data if RFID exists
                if (studentData.rfid) {
                    const studentRfid = studentData.rfid.toUpperCase();
                    const historyQuery = query(
                        collection(db, "rfid_history"),
                        where("uid", "==", studentRfid)
                    );
                    const historySnapshot = await getDocs(historyQuery);
                    
                    const scans = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RawScan));
                    setAllScans(scans);
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

    const attendedDays = useMemo(() => {
        const uniqueDays = new Set<string>();
        allScans.forEach(scan => {
            const scanDate = parseScanDate(scan.time);
            if (scanDate) {
                uniqueDays.add(format(scanDate, "yyyy-MM-dd"));
            }
        });
        return Array.from(uniqueDays).map(dayStr => new Date(dayStr + 'T00:00:00')); // Use T00:00:00 to avoid timezone issues
    }, [allScans]);

    const dailyAttendanceLog = useMemo((): DailyAttendance[] => {
        if (!selectedDate || allScans.length === 0) return [];
        
        return allScans
            .filter(scan => {
                const scanDate = parseScanDate(scan.time);
                return scanDate && isSameDay(scanDate, selectedDate);
            })
            .map(scan => ({
                time: format(parseScanDate(scan.time)!, 'p'),
                subject: scan.classScheduleId ? scheduleMap.get(scan.classScheduleId)?.subject || 'Unknown Subject' : 'General Scan'
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [selectedDate, allScans, scheduleMap]);

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
            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-2">
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

                <div className="lg:col-span-3 grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Calendar</CardTitle>
                            <CardDescription>
                                Click a highlighted day to see detailed subject attendance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                defaultMonth={new Date()}
                                className="p-0"
                                modifiers={{ attended: attendedDays }}
                                modifiersClassNames={{
                                    attended: "bg-green-200/50 text-green-800 hover:bg-green-200/70 focus:bg-green-200/70",
                                }}
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Daily Scan Log</CardTitle>
                            <CardDescription>
                                {selectedDate ? `Scans for ${format(selectedDate, 'PPP')}` : "Select a day from the calendar to view its log."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!selectedDate ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                                    <CalendarClock className="h-10 w-10 mb-2"/>
                                    <p>No day selected.</p>
                                </div>
                            ) : dailyAttendanceLog.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                                    <p>No scans recorded for this day.</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {dailyAttendanceLog.map((log, index) => (
                                        <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="h-5 w-5 text-primary"/>
                                                <div>
                                                     <p className="font-medium">{log.subject}</p>
                                                </div>
                                            </div>
                                            <p className="font-mono text-sm text-muted-foreground">{log.time}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

