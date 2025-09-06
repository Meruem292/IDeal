import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Fingerprint, History, Users } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

function Logo() {
  return (
    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
      <CheckCircle className="h-8 w-8 text-accent" />
      <span className="font-headline">IDeal</span>
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-16 md:py-24 lg:py-32">
          <div className="container text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Seamless Attendance, Simplified.
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
              IDeal RFID leverages modern technology to automate attendance, providing accurate, real-time data for students and faculty.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-secondary">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline">Why IDeal?</h2>
              <p className="text-muted-foreground mt-2">Discover the features that make attendance effortless.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Fingerprint className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">RFID Registration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Students can easily register their unique RFID cards with their profiles, ensuring a secure and personal connection.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                       <History className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">Automated Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Time-in and time-out are recorded automatically when an RFID card is scanned, eliminating manual processes and errors.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">Role-Based Access</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Secure portals for students, faculty, and admins ensure that everyone sees only the information relevant to them.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container text-center">
            <h2 className="text-3xl font-bold font-headline">Ready to Modernize Your Attendance System?</h2>
            <p className="text-muted-foreground mt-2">Join the future of education management.</p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/register">Create an Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built for the modern campus.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} IDeal RFID. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
