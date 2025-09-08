
"use client"
import { useState, useEffect } from "react"
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
import { Loader2, Trash2, Edit, PlusCircle, MonitorSmartphone } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, query, where } from "firebase/firestore"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Scanner = {
  id: string
  deviceId: string
  sectionId: string
  sectionName?: string
}

type Section = {
  id: string
  name: string
}

export default function ManageScannersPage() {
  const [scanners, setScanners] = useState<Scanner[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [isScannerDialogOpen, setIsScannerDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedScanner, setSelectedScanner] = useState<Scanner | null>(null)
  
  const { toast } = useToast()

  const fetchScannersAndSections = async () => {
    setIsLoading(true)
    try {
      const sectionsSnapshot = await getDocs(collection(db, "sections"))
      const sectionsList = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section))
      setSections(sectionsList)

      const scannersSnapshot = await getDocs(collection(db, "scanners"))
      const scannersList = scannersSnapshot.docs.map(doc => {
        const scannerData = doc.data()
        const section = sectionsList.find(s => s.id === scannerData.sectionId)
        return { 
          id: doc.id, 
          deviceId: scannerData.deviceId,
          sectionId: scannerData.sectionId,
          sectionName: section?.name || 'Unassigned'
        } as Scanner
      })
      setScanners(scannersList)

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error fetching data", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScannersAndSections()
  }, [])
  
  const handleScannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScanner || !selectedScanner.deviceId || !selectedScanner.sectionId) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please enter a Device ID and select a section." })
        return
    }
    setIsProcessing(true)
    
    try {
      const existingScannerQuery = query(collection(db, "scanners"), where("deviceId", "==", selectedScanner.deviceId));
      const existingScannerSnapshot = await getDocs(existingScannerQuery);

      if (selectedScanner.id === 'new' && !existingScannerSnapshot.empty) {
        toast({ variant: "destructive", title: "Device ID Exists", description: "This Device ID is already registered." });
        setIsProcessing(false);
        return;
      }
      
      const scannerData = {
          deviceId: selectedScanner.deviceId,
          sectionId: selectedScanner.sectionId,
      };

      if (selectedScanner.id === 'new') { 
        await addDoc(collection(db, "scanners"), scannerData)
        toast({ title: "Scanner Added", description: `Device ${scannerData.deviceId} has been added.` })
      } else { 
        const scannerRef = doc(db, "scanners", selectedScanner.id);
        await updateDoc(scannerRef, scannerData);
        toast({ title: "Scanner Updated", description: "Scanner details have been updated." })
      }
      fetchScannersAndSections()
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error saving scanner", description: error.message })
    } finally {
      setIsProcessing(false)
      setIsScannerDialogOpen(false)
      setSelectedScanner(null)
    }
  }
  
  const handleDeleteScanner = async () => {
    if (!selectedScanner) return
    setIsProcessing(true)
    try {
      await deleteDoc(doc(db, "scanners", selectedScanner.id))
      toast({ title: "Scanner Deleted", description: `Device ${selectedScanner.deviceId} has been removed.` })
      fetchScannersAndSections()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error deleting scanner", description: error.message })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setSelectedScanner(null)
    }
  }

  const openScannerDialog = (scanner?: Scanner) => {
    setSelectedScanner(scanner || { id: 'new', deviceId: '', sectionId: '' })
    setIsScannerDialogOpen(true)
  }

  const openDeleteDialog = (scanner: Scanner) => {
    setSelectedScanner(scanner)
    setIsDeleteDialogOpen(true)
  }

  return (
    <DashboardLayout role="admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Scanners</CardTitle>
            <CardDescription>
              Register new scanner devices and assign them to sections.
            </CardDescription>
          </div>
          <Button onClick={() => openScannerDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Scanner
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : scanners.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Assigned Section</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanners.map((scanner) => (
                  <TableRow key={scanner.id}>
                    <TableCell className="font-medium font-mono">{scanner.deviceId}</TableCell>
                    <TableCell>{scanner.sectionName}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openScannerDialog(scanner)} className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(scanner)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <MonitorSmartphone className="h-10 w-10 mb-2"/>
                <p>No scanner devices have been registered yet.</p>
                <Button className="mt-4" onClick={() => openScannerDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Scanner
                </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Scanner Dialog */}
      <Dialog open={isScannerDialogOpen} onOpenChange={setIsScannerDialogOpen}>
        <DialogContent>
          <form onSubmit={handleScannerSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedScanner?.id === 'new' ? 'Add New Scanner' : 'Edit Scanner'}</DialogTitle>
              <DialogDescription>
                Enter a unique ID for the device and assign it to a section.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-1.5">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <Input 
                    id="deviceId" 
                    value={selectedScanner?.deviceId || ''} 
                    onChange={(e) => setSelectedScanner(s => s ? {...s, deviceId: e.target.value} : null)} 
                    placeholder="e.g., SCANNER-001"
                    required 
                    className="font-mono"
                  />
              </div>
              <div className="grid gap-1.5">
                    <Label htmlFor="section">Assign to Section</Label>
                    <Select 
                        value={selectedScanner?.sectionId || ''} 
                        onValueChange={value => setSelectedScanner(s => s ? {...s, sectionId: value } : null)} 
                        required
                    >
                        <SelectTrigger id="section"><SelectValue placeholder="Select a section" /></SelectTrigger>
                        <SelectContent>
                            {sections.length > 0 ? (
                                sections.map(sec => <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>)
                            ) : (
                                <SelectItem value="no-sections" disabled>No sections available</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Scanner
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
                This will permanently delete the scanner "{selectedScanner?.deviceId}". This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleDeleteScanner} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
