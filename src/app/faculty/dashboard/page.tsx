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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { mockAttendance, mockStudents, AttendanceRecord, Student } from "@/lib/mock-data"

function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Name</TableHead>
          <TableHead>Student ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time In</TableHead>
          <TableHead>Time Out</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">{record.studentName}</TableCell>
            <TableCell>{record.studentId}</TableCell>
            <TableCell>
              <Badge
                variant={record.status === "Present" ? "default" : "destructive"}
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
  )
}


export default function FacultyDashboardPage() {
  const todayAttendance = mockAttendance.filter(rec => rec.date === new Date().toISOString().split('T')[0]);
  const presentStudents = todayAttendance.filter(r => r.status === 'Present');
  const absentStudents = todayAttendance.filter(r => r.status === 'Absent');

  return (
    <DashboardLayout role="faculty">
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total Students</CardDescription>
              <CardTitle>{mockStudents.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Present Today</CardDescription>
              <CardTitle className="text-green-600">{presentStudents.length}</CardTitle>
            </CardHeader>
          </Card>
           <Card>
            <CardHeader>
              <CardDescription>Absent Today</CardDescription>
              <CardTitle className="text-red-600">{absentStudents.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
            <CardDescription>
              View and manage student attendance records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today">
              <TabsList>
                <TabsTrigger value="today">Today's Attendance</TabsTrigger>
                <TabsTrigger value="present">Present</TabsTrigger>
                <TabsTrigger value="absent">Absent</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="mt-4">
                <AttendanceTable records={todayAttendance} />
              </TabsContent>
              <TabsContent value="present" className="mt-4">
                <AttendanceTable records={presentStudents} />
              </TabsContent>
              <TabsContent value="absent" className="mt-4">
                 <AttendanceTable records={absentStudents} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
