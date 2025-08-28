
"use client"
import { useState, useEffect } from "react"
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

    useEffect(() => {
        const fetchRfidHistory = async () => {
            setIsLoading(true);
            try {
                // Query students collection for documents that have a non-null rfid field
                const studentsQuery = query(collection(db, "students"), where("rfid", "!=", null));
                const studentsSnapshot = await getDocs(studentsQuery);
                
                const registrationList: RfidRegistration[] = [];
                studentsSnapshot.forEach(doc => {
                    const studentData = doc.data();
                    if (studentData.rfid) { // Should always be true due to query, but good practice
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
                                {registrations.map(reg => (
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
            </Card>
        </DashboardLayout>
    )
}
