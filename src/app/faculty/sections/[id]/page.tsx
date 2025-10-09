
"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  parse,
} from 'date-fns'
import { DashboardLayout } from '@/components/dashboard-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Student } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Section = { id: string; name: string }
type Schedule = { id: string; subject: string; startTime: string; endTime: string, facultyId?: string }
type RawScan = { uid: string; time: string; classScheduleId: string }
type AttendanceStatus = 'Present' | 'Late' | 'Absent'

const LATE_GRACE_PERIOD_MINUTES = 15

function AttendanceGrid({
  students,
  scans,
  schedule,
  daysInMonth
}: {
  students: Student[],
  scans: RawScan[],
  schedule: Schedule,
  daysInMonth: Date[]
}) {
  
  const attendanceData = useMemo(() => {
    return students.map(student => {
      const studentScans = scans.filter(s => s.uid.toUpperCase() === student.rfid?.toUpperCase())
      const attendanceByDate = new Map<string, AttendanceStatus>()

      daysInMonth.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const scanForDay = studentScans.find(s => s.time.startsWith(dayStr) && s.classScheduleId === schedule.id)

        let status: AttendanceStatus = 'Absent';

        if (scanForDay) {
          const scanDate = new Date(scanForDay.time.replace(' ', 'T'));
          const scheduleStartTime = parse(schedule.startTime, 'HH:mm', day);
          const lateTime = new Date(scheduleStartTime.getTime() + LATE_GRACE_PERIOD_MINUTES * 60000);
          if (scanDate > lateTime) {
            status = 'Late';
          } else {
            status = 'Present';
          }
        }
        attendanceByDate.set(dayStr, status);
      });

      return {
        studentId: student.id,
        studentName: `${student.lastName}, ${student.firstName}`,
        attendance: attendanceByDate,
      }
    })
  }, [students, scans, schedule, daysInMonth])
  
  const getCellClass = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'Present': return 'bg-green-100 dark:bg-green-900/50'
      case 'Late': return 'bg-yellow-100 dark:bg-yellow-900/50'
      case 'Absent': return 'bg-red-100 dark:bg-red-900/50'
      default: return 'bg-muted/20'
    }
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
       <Table className="min-w-full">
          <TableHeader>
              <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 bg-background z-10 w-48 font-semibold">Student Name</TableHead>
              {daysInMonth.map(day => (
                  <TableHead key={day.toString()} className="text-center min-w-[60px]">
                      <div className="flex flex-col items-center">
                          <span className="text-xs">{format(day, 'EEE')}</span>
                          <span className="font-bold text-lg">{format(day, 'd')}</span>
                      </div>
                  </TableHead>
              ))}
              </TableRow>
          </TableHeader>
          <TableBody>
              {attendanceData.map(({ studentId, studentName, attendance }) => (
              <TableRow key={studentId}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">{studentName}</TableCell>
                  {daysInMonth.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const status = attendance.get(dayStr)
                  return (
                      <TableCell key={dayStr} className={cn("text-center p-0 h-16", getCellClass(status))}>
                         {status && (
                             <div className="w-full h-full flex items-center justify-center font-semibold text-xs">
                              {/* We can put content here if needed later */}
                             </div>
                         )}
                      </TableCell>
                  )
                  })}
              </TableRow>
              ))}
          </TableBody>
      </Table>
    </div>
  )
}


export default function SectionAttendancePage() {
  const params = useParams()
  const sectionId = params.id as string

  const [section, setSection] = useState<Section | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [facultySchedules, setFacultySchedules] = useState<Schedule[]>([])
  const [scans, setScans] = useState<RawScan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  useEffect(() => {
    if (!sectionId) return

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
            setError("You must be logged in.");
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            // Fetch Section Details
            const sectionDoc = await getDoc(doc(db, 'sections', sectionId))
            if (!sectionDoc.exists()) throw new Error('Section not found')
            setSection({ id: sectionDoc.id, ...sectionDoc.data() } as Section)

            // Fetch Students in Section
            const studentsQuery = query(collection(db, 'students'), where('sectionId', '==', sectionId))
            const studentsSnapshot = await getDocs(studentsQuery)
            const studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)).sort((a, b) => a.lastName.localeCompare(b.lastName))
            setStudents(studentList)

            // Fetch Section's Schedule and filter for current faculty
            const schedulesSnapshot = await getDocs(collection(db, `sections/${sectionId}/schedules`))
            const allSchedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule))
            const facultySchedules = allSchedules.filter(s => s.facultyId === user.uid)
            setFacultySchedules(facultySchedules);
            
            // Fetch all relevant scans for the month
             if (studentList.length > 0) {
                const studentRfids = studentList.map(s => s.rfid).filter(Boolean) as string[]
                if (studentRfids.length > 0) {
                    const scansQuery = query(collection(db, 'rfid_history'), where('uid', 'in', studentRfids))
                    const scansSnapshot = await getDocs(scansQuery)
                    const allScans = scansSnapshot.docs.map(doc => doc.data() as RawScan)
                    setScans(allScans)
                }
            }

        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    });

    return () => unsubscribe();
  }, [sectionId])

  if (isLoading) {
    return <DashboardLayout role="faculty"><div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></DashboardLayout>
  }

  if (error) {
    return <DashboardLayout role="faculty"><div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive p-8 text-center"><AlertCircle className="h-10 w-10 mb-4" /><h2 className="text-xl font-semibold mb-2">Could Not Load Section</h2><p>{error}</p></div></DashboardLayout>
  }
  
  const defaultTab = facultySchedules[0]?.id || "";

  return (
    <DashboardLayout role="faculty">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Sheet: {section?.name}</CardTitle>
          <CardDescription>
            {`Viewing attendance for your handled subjects. Month of ${format(currentMonth, 'MMMM yyyy')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facultySchedules.length > 0 ? (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList>
                {facultySchedules.map(schedule => (
                  <TabsTrigger key={schedule.id} value={schedule.id}>
                    {schedule.subject} ({schedule.startTime})
                  </TabsTrigger>
                ))}
              </TabsList>
              {facultySchedules.map(schedule => (
                <TabsContent key={schedule.id} value={schedule.id} className="mt-4">
                  <AttendanceGrid 
                    students={students}
                    scans={scans}
                    schedule={schedule}
                    daysInMonth={daysInMonth}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <div className="text-center text-muted-foreground p-8">You are not assigned to teach any subjects in this section.</div>
          )}

           <div className="flex items-center gap-4 mt-4 p-2">
                <h4 className="font-semibold text-sm">Legend:</h4>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-100 border"></div><span className="text-xs">Present</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-100 border"></div><span className="text-xs">Late</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-100 border"></div><span className="text-xs">Absent</span></div>
           </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

    