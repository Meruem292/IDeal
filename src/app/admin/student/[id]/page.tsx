
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
import { Loader2, AlertCircle, CalendarClock, BookOpen, CheckCircle, XCircle, Clock } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import type { Student } from "@/lib/mock-data"
import { format, isSameDay, parse, set } from "date-fns"

type RawScan = {
    id: string;
    time: string; // The date string from Firestore
    uid: string;
    classScheduleId?: string;
    sectionId?: string;
};

type Schedule = {
    id: string;
    subject: string;
    startTime: string;
    endTime: string;
}

type DailyAttendance = {
    subject: string;
    startTime: string;
    endTime: string;
    status: 'Present' | 'Absent' | 'Late';
    scanTime: string | null;
}

const parseScanDate = (time: string): Date | null => {
    try {
        const date = new Date(time.replace(' ', 'T')); // Make it ISO-like
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        return null;
    }
};

const LATE_GRACE_PERIOD_MINUTES = 15;

export default function StudentProfilePage() {
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [allScans, setAllScans] = useState<RawScan[]>([]);
    const [sectionSchedule, setSectionSchedule] = useState<Schedule[]>([]);
    
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

                // 2. Fetch the student's section schedule if they have one
                if (studentData.sectionId) {
                    const scheduleQuery = query(collection(db, `sections/${studentData.sectionId}/schedules`));
                    const scheduleSnapshot = await getDocs(scheduleQuery);
                    const scheduleList = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
                    setSectionSchedule(scheduleList.sort((a,b) => a.startTime.localeCompare(b.startTime)));
                }

                // 3. Fetch all attendance data for the student if RFID exists
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
        if (!selectedDate || sectionSchedule.length === 0) return [];
        
        const scansForDay = allScans.filter(scan => {
            const scanDate = parseScanDate(scan.time);
            return scanDate && isSameDay(scanDate, selectedDate);
        });

        return sectionSchedule.map(scheduleItem => {
            const attendingScan = scansForDay.find(scan => scan.classScheduleId === scheduleItem.id);
            
            let status: DailyAttendance['status'] = 'Absent';
            let scanTime: string | null = null;

            if (attendingScan) {
                const scanDate = parseScanDate(attendingScan.time)!;
                scanTime = format(scanDate, 'p');

                const scheduleStartTime = parse(scheduleItem.startTime, 'HH:mm', selectedDate);
                const scheduleEndTime = parse(scheduleItem.endTime, 'HH:mm', selectedDate);
                const lateTime = new Date(scheduleStartTime.getTime() + LATE_GRACE_PERIOD_MINUTES * 60000);

                if (scanDate > scheduleEndTime) {
                    status = 'Absent';
                } else if (scanDate > lateTime) {
                    status = 'Late';
                } else {
                    status = 'Present';
                }
            }
            
            return {
                subject: scheduleItem.subject,
                startTime: scheduleItem.startTime,
                endTime: scheduleItem.endTime,
                status,
                scanTime,
            };
        });
    }, [selectedDate, sectionSchedule, allScans]);

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

    const attendanceStatusMap = {
        Present: {
            icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />,
            bgColor: 'bg-green-100/80 dark:bg-green-900/40',
            timeColor: 'text-green-700 dark:text-green-400',
            labelColor: 'text-green-600 dark:text-green-500',
            label: 'Present',
        },
        Late: {
            icon: <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />,
            bgColor: 'bg-yellow-100/80 dark:bg-yellow-900/40',
            timeColor: 'text-yellow-700 dark:text-yellow-400',
            labelColor: 'text-yellow-600 dark:text-yellow-500',
            label: 'Late',
        },
        Absent: {
            icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
            bgColor: 'bg-red-100/60 dark:bg-red-900/30',
            timeColor: '',
            labelColor: 'text-red-600 dark:text-red-500',
            label: 'Absent',
        },
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
                                    attended: "bg-green-200/50 text-green-800 hover:bg-green-200/70 focus:bg-green-200/70 dark:bg-green-800/30 dark:text-green-300",
                                }}
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Daily Attendance Log</CardTitle>
                            <CardDescription>
                                {selectedDate ? `Attendance for ${format(selectedDate, 'PPP')}` : "Select a day from the calendar to view its log."}
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
                                    <BookOpen className="h-10 w-10 mb-2"/>
                                    <p>No schedule found for this student's section, or no scans recorded for this day.</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {dailyAttendanceLog.map((log, index) => {
                                        const statusInfo = attendanceStatusMap[log.status];
                                        return (
                                            <li key={index} className={`flex items-center justify-between p-3 rounded-md ${statusInfo.bgColor}`}>
                                                <div className="flex items-center gap-3">
                                                    {statusInfo.icon}
                                                    <div>
                                                        <p className="font-medium">{log.subject}</p>
                                                        <p className="text-xs text-muted-foreground">{log.startTime} - {log.endTime}</p>
                                                    </div>
                                                </div>
                                                {log.scanTime ? (
                                                    <p className={`font-mono text-sm font-semibold ${statusInfo.timeColor}`}>{log.scanTime}</p>
                                                ) : (
                                                    <p className={`text-sm font-semibold ${statusInfo.labelColor}`}>{statusInfo.label}</p>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

    
    