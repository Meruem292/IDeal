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
import { mockStudents, Student } from "@/lib/mock-data"
import { Fingerprint } from "lucide-react"

export default function FacultyStudentsPage() {
  const students: Student[] = mockStudents

  return (
    <DashboardLayout role="faculty">
      <Card>
        <CardHeader>
          <CardTitle>Manage Students</CardTitle>
          <CardDescription>
            A list of all students in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>RFID Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.id}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={student.rfid ? "secondary" : "outline"}
                      className={`flex w-fit items-center gap-1.5 ${student.rfid ? 'text-primary border-primary/20 bg-primary/10' : ''}`}
                    >
                      <Fingerprint className="h-3 w-3" />
                      {student.rfid ? "Registered" : "Not Registered"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
