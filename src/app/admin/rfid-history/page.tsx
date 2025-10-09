
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
import { db } from "@/lib/firebase"
import { collection, getDocs, where, query } from "firebase/firestore"
import { Loader2 } from "lucide-react"

type RfidRegistration = {
    rfid: string;
    studentId: string;
    studentName: string;
};


export default function RfidHistoryPage() {
    const [registrations, setRegistrations] = useState<RfidRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ROWS_PER_PAGE = 10;

    useEffect(() => {
        const fetchRfidHistory = async () => {
            setIsLoading(true);
            try {
                const studentsQuery = query(collection(db, "students"), where("rfid", "!=", null));
                const studentsSnapshot = await getDocs(studentsQuery);
                
                const registrationList: RfidRegistration[] = [];
                studentsSnapshot.forEach(doc => {
                    const studentData = doc.data();
                    if (studentData.rfid) {
                        registrationList.push({
                            rfid: studentData.rfid,
                            studentId: doc.id,
                            studentName: `${studentData.firstName} ${studentData.lastName}`,
                        });
                    }
                });

                setRegistrations(registrationList);

            } catch (error) {
                console.error("Error fetching RFID registrations: ", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRfidHistory();
    }, []);

    const totalPages = Math.ceil(registrations.length / ROWS_PER_PAGE);
    const paginatedRegistrations = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        return registrations.slice(startIndex, endIndex);
    }, [registrations, currentPage]);

    return (
        <DashboardLayout role="admin">
            <Card>
                <CardHeader>
                    <CardTitle>RFID Registration History</CardTitle>
                    <CardDescription>
                        A log of all RFID cards currently registered to students.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>RFID Tag ID</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Student ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRegistrations.map(reg => (
                                    <TableRow key={reg.rfid}>
                                        <TableCell className="font-medium font-mono">{reg.rfid}</TableCell>
                                        <TableCell>{reg.studentName}</TableCell>
                                        <TableCell>{reg.studentId}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                    </CardFooter>
                )}
            </Card>
        </DashboardLayout>
    )
}
