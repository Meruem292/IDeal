"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function RegisterForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Registration Submitted",
        description: "Your faculty account is pending admin approval.",
      })
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="absolute top-8 left-8">
         <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <CheckCircle className="h-8 w-8 text-accent" />
            <span className="font-headline">EduTrack</span>
         </Link>
       </div>
      <Card className="w-full max-w-sm">
        <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Register</CardTitle>
            <CardDescription>
              Create your faculty account. Student accounts are pre-provisioned.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="John Doe" required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" required disabled={isLoading} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="e.g., Computer Science" required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="underline hover:text-primary">
                    Login
                </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
