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
import { mockStudentAttendance, AttendanceRecord } from "@/lib/mock-data"
import { Check, X, Clock } from "lucide-react"

export default function StudentDashboardPage() {
  const attendanceData: AttendanceRecord[] = mockStudentAttendance
  const todayRecord = attendanceData[0] // Assume first is today

  return (
    <DashboardLayout role="student">
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Today's Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                {todayRecord.status === "Present" ? (
                  <Check className="text-green-500" />
                ) : (
                  <X className="text-red-500" />
                )}
                {todayRecord.status}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Time In</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-blue-500" />
                {todayRecord.timeIn || "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Time Out</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-purple-500" />
                {todayRecord.timeOut || "N/A"}
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
                {attendanceData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
