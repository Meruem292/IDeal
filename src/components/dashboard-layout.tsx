
"use client"
import Link from "next/link"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar"
import {
  Home,
  User,
  BookUser,
  CheckCircle,
  LogOut,
  Settings,
  UserPlus,
  Users,
  ClipboardList,
  History,
  Fingerprint,
  Loader2,
  ChevronLeft,
  MonitorSmartphone,
  CalendarCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import type { User as FirebaseAuthUser } from "firebase/auth"
import { useAuthRole } from "@/hooks/use-auth-role"
import { ModeToggle } from "@/components/mode-toggle"

type UserRole = "student" | "faculty" | "admin"

const navItems: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: Home },
    { href: "/student/profile", label: "My Profile", icon: User },
  ],
  faculty: [
    { href: "/faculty/dashboard", label: "Dashboard", icon: Home },
    { href: "/faculty/manage-sections", label: "My Sections", icon: ClipboardList },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/manage-faculty", label: "Manage Faculty", icon: Users },
    { href: "/admin/manage-students", label: "Manage Students", icon: BookUser },
    { href: "/admin/create-faculty", label: "Create Faculty", icon: UserPlus },
    { href: "/admin/manage-sections", label: "Manage Sections", icon: ClipboardList },
    { href: "/admin/manage-scanners", label: "Manage Scanners", icon: MonitorSmartphone },
    { href: "/admin/attendance", label: "Attendance Logs", icon: History },
    { href: "/admin/rfid-history", label: "RFID History", icon: Fingerprint },
  ],
}

function UserNav({ role }: { role: UserRole }) {
  const profileLink = `/${role}/profile`
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return role.charAt(0).toUpperCase();
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Something went wrong.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitial()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none capitalize">{role}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || `${role}@ideal.com`}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === "student" && (
            <DropdownMenuItem asChild>
                 <Link href={profileLink}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PageHeaderTitle() {
    const pathname = usePathname();
    const router = useRouter();

    const isStudentProfile = pathname.startsWith('/admin/student/');
    const isFacultySectionAttendance = pathname.startsWith('/faculty/sections/');
    
    let title = pathname.split("/").pop()?.replace(/-/g, " ") || "";
    if (isStudentProfile) title = "Student Profile";
    if (isFacultySectionAttendance) title = "Section Attendance";


    const canGoBack = isStudentProfile || isFacultySectionAttendance;

    return (
        <div className="flex items-center gap-2">
        {canGoBack && (
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
        )}
         <h1 className="text-xl font-semibold font-headline capitalize">
            {title}
        </h1>
        </div>
    )

}

export function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode
  role: UserRole
}) {
  const pathname = usePathname()
  const { isChecking, isAuthorized } = useAuthRole(role)

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
             <Button onClick={() => window.location.href = '/login'} className="mt-4">
                Go to Login
            </Button>
        </div>
      </div>
    );
  }

  const currentNavItems = navItems[role];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 text-xl font-semibold text-primary">
            <CheckCircle className="h-7 w-7 text-accent" />
            <span className="font-headline">IDeal</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {currentNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1">
             <PageHeaderTitle />
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserNav role={role} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
