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
import { Users } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="admin">
      <Card>
        <CardHeader>
          <CardTitle>Admin Control Panel</CardTitle>
          <CardDescription>
            Manage faculty and system settings from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Faculty Management
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Create and manage faculty accounts.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/admin/create-faculty">Create Faculty</Link>
                    </Button>
                 </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
