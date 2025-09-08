
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, BookUser, UserPlus, ClipboardList, History, Fingerprint, MonitorSmartphone } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="admin">
      <Card>
        <CardHeader>
          <CardTitle>Admin Control Panel</CardTitle>
          <CardDescription>
            Manage faculty, students, and system settings from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Manage Faculty
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        View, edit, and delete faculty accounts.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/manage-faculty">Manage Faculty</Link>
                    </Button>
                 </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Manage Students
                    </CardTitle>
                    <BookUser className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        View, edit, and delete student records.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/manage-students">Manage Students</Link>
                    </Button>
                 </CardFooter>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Create Faculty
                    </CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Create new accounts for faculty members.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/create-faculty">Create Faculty</Link>
                    </Button>
                 </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Manage Sections
                    </CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Create sections and manage schedules.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/manage-sections">Manage Sections</Link>
                    </Button>
                 </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Manage Scanners
                    </CardTitle>
                    <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                       Add scanner devices and assign sections.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/manage-scanners">Manage Scanners</Link>
                    </Button>
                 </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Attendance Logs
                    </CardTitle>
                    <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        View all historical attendance records.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/attendance">View Logs</Link>
                    </Button>
                 </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    RFID History
                    </CardTitle>
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        View student RFID registration history.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/rfid-history">View History</Link>
                    </Button>
                 </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
