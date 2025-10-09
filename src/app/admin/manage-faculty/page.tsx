
"use client"
import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Edit, PlusCircle, Search, UserPlus } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { initializeApp, deleteApp }from "firebase/app"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Faculty = {
  id: string
  name: string
  email: string
  subject: string
  role: string
}

type FacultyFormData = {
  id?: string;
  name: string;
  email: string;
  password?: string;
  subject: string;
}

export default function ManageFacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [isFacultyDialogOpen, setIsFacultyDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null)
  const [formData, setFormData] = useState<FacultyFormData | null>(null)

  const [searchTerm, setSearchTerm] = useState("")

  const { toast } = useToast()

  const fetchFaculty = async () => {
    setIsLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "faculty"))
      const facultyList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty))
      setFaculty(facultyList)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching faculty",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFaculty()
  }, [])
  
  // One-time check to create the admin document if it doesn't exist
  useEffect(() => {
    const bootstrapAdmin = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email === 'admin@gmail.com') {
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists()) {
          try {
            await setDoc(adminDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'admin'
            });
          } catch (error: any) {
             console.error("Failed to create admin document:", error);
             toast({
              variant: "destructive",
              title: "Admin Init Failed",
              description: error.message,
            });
          }
        }
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        bootstrapAdmin();
        unsubscribe();
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setIsProcessing(true);

    if (formData.id) { // This is an update
      try {
        const facultyRef = doc(db, "faculty", formData.id);
        await updateDoc(facultyRef, {
          name: formData.name,
          subject: formData.subject,
        });
        toast({ title: "Faculty Updated", description: "Faculty details have been updated." });
        fetchFaculty();
      } catch (error: any) {
         toast({
          variant: "destructive",
          title: "Error updating faculty",
          description: error.message,
        })
      } finally {
        setIsProcessing(false)
        setIsFacultyDialogOpen(false)
        setFormData(null)
      }
    } else { // This is a create
        if (!formData.email || !formData.password) {
            toast({ variant: "destructive", title: "Missing fields", description: "Email and password are required to create a new faculty." });
            setIsProcessing(false);
            return;
        }

        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        
        let secondaryApp;
        try {
          const secondaryAppName = `secondary-auth-${Date.now()}`;
          secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
          const secondaryAuth = getAuth(secondaryApp);

          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
          const user = userCredential.user;

          await setDoc(doc(db, "faculty", user.uid), {
            id: user.uid,
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            role: 'faculty',
          });

          toast({
            title: "Faculty Account Created",
            description: `Account for ${formData.name} has been created successfully.`,
          })
          fetchFaculty();
        } catch (error: any) {
          console.error("Error creating faculty:", error);
          toast({
            variant: "destructive",
            title: "Creation Failed",
            description: error.message || "An unknown error occurred.",
          })
        } finally {
          setIsProcessing(false)
          setIsFacultyDialogOpen(false)
          setFormData(null)
           if (secondaryApp) {
            await deleteApp(secondaryApp);
          }
        }
    }
  }


  const handleDelete = async () => {
    if (!selectedFaculty) return
    setIsProcessing(true)
    try {
      await deleteDoc(doc(db, "faculty", selectedFaculty.id))
      toast({ title: "Faculty Deleted", description: `Account for ${selectedFaculty.name} has been deleted.` })
      fetchFaculty() // Refresh list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting faculty",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setSelectedFaculty(null)
    }
  }

  const openFacultyDialog = (facultyMember?: Faculty) => {
    setFormData(facultyMember ? { ...facultyMember } : { name: '', email: '', subject: '', password: '' });
    setIsFacultyDialogOpen(true);
  }

  const openDeleteDialog = (facultyMember: Faculty) => {
    setSelectedFaculty(facultyMember)
    setIsDeleteDialogOpen(true)
  }

  const filteredFaculty = useMemo(() => {
    if (!searchTerm) return faculty;
    return faculty.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [faculty, searchTerm]);


  return (
    <DashboardLayout role="admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Faculty</CardTitle>
            <CardDescription>
              View, create, edit, or delete faculty accounts.
            </CardDescription>
          </div>
          <Button onClick={() => openFacultyDialog()}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Faculty
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search by faculty name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
              </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.subject}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openFacultyDialog(member)} className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(member)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFacultyDialogOpen} onOpenChange={(isOpen) => { setIsFacultyDialogOpen(isOpen); if (!isOpen) setFormData(null); }}>
        <DialogContent>
          <form onSubmit={handleFacultySubmit}>
            <DialogHeader>
              <DialogTitle>{formData?.id ? 'Edit Faculty' : 'Create Faculty Account'}</DialogTitle>
              <DialogDescription>
                {formData?.id ? `Update the details for ${formData.name}.` : 'Enter the details below to create a new faculty account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <div className="grid gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Dr. John Doe"
                  value={formData?.name || ''}
                  onChange={(e) => setFormData(f => f ? { ...f, name: e.target.value } : null)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  type="text"
                  id="subject"
                  placeholder="e.g., Computer Science"
                  value={formData?.subject || ''}
                  onChange={(e) => setFormData(f => f ? { ...f, subject: e.target.value } : null)}
                  required
                  disabled={isProcessing}
                />
              </div>
              {!formData?.id && (
                <>
                    <div className="grid gap-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                        type="email"
                        id="email"
                        placeholder="faculty@example.com"
                        value={formData?.email || ''}
                        onChange={(e) => setFormData(f => f ? { ...f, email: e.target.value } : null)}
                        required
                        disabled={isProcessing}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="password">Temporary Password</Label>
                        <Input
                        type="password"
                        id="password"
                        value={formData?.password || ''}
                        onChange={(e) => setFormData(f => f ? { ...f, password: e.target.value } : null)}
                        required
                        disabled={isProcessing}
                        />
                    </div>
                </>
              )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {formData?.id ? 'Save Changes' : 'Create Account'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the account for {selectedFaculty?.name}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
