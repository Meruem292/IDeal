export type Student = {
  id: string
  name: string
  rfid: string | null
}

export type AttendanceRecord = {
  id: string
  studentId: string
  studentName: string
  date: string
  timeIn: string | null
  timeOut: string | null
  status: "Present" | "Absent"
}

export type FacultyApproval = {
  id: string
  name: string
  email: string
  department: string
}

export const mockStudents: Student[] = [
  { id: "S001", name: "Alice Johnson", rfid: "A1B2C3D4" },
  { id: "S002", name: "Bob Williams", rfid: null },
  { id: "S003", name: "Charlie Brown", rfid: "E5F6G7H8" },
  { id: "S004", name: "Diana Miller", rfid: "I9J0K1L2" },
  { id: "S005", name: "Ethan Davis", rfid: null },
]

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

export const mockAttendance: AttendanceRecord[] = [
  { id: "A001", studentId: "S001", studentName: "Alice Johnson", date: today, timeIn: "08:55", timeOut: null, status: "Present" },
  { id: "A002", studentId: "S002", studentName: "Bob Williams", date: today, timeIn: null, timeOut: null, status: "Absent" },
  { id: "A003", studentId: "S003", studentName: "Charlie Brown", date: today, timeIn: "09:02", timeOut: "16:05", status: "Present" },
  { id: "A004", studentId: "S004", studentName: "Diana Miller", date: today, timeIn: "08:49", timeOut: null, status: "Present" },
  { id: "A005", studentId: "S005", studentName: "Ethan Davis", date: today, timeIn: null, timeOut: null, status: "Absent" },
  { id: "A006", studentId: "S001", studentName: "Alice Johnson", date: yesterday, timeIn: "09:01", timeOut: "16:15", status: "Present" },
  { id: "A007", studentId: "S003", studentName: "Charlie Brown", date: yesterday, timeIn: "08:58", timeOut: "15:59", status: "Present" },
  { id: "A008", studentId: "S004", studentName: "Diana Miller", date: yesterday, timeIn: "09:05", timeOut: "16:01", status: "Present" },
]

export const mockStudentAttendance: AttendanceRecord[] = [
  { id: "A001", studentId: "S001", studentName: "Alice Johnson", date: today, timeIn: "08:55", timeOut: "17:01", status: "Present" },
  { id: "A006", studentId: "S001", studentName: "Alice Johnson", date: yesterday, timeIn: "09:01", timeOut: "16:15", status: "Present" },
  { id: "A009", studentId: "S001", studentName: "Alice Johnson", date: "2023-10-25", timeIn: "08:59", timeOut: "16:00", status: "Present" },
  { id: "A010", studentId: "S001", studentName: "Alice Johnson", date: "2023-10-24", timeIn: null, timeOut: null, status: "Absent" },
  { id: "A011", studentId: "S001", studentName: "Alice Johnson", date: "2023-10-23", timeIn: "09:03", timeOut: "16:20", status: "Present" },
]


export const mockFacultyApprovals: FacultyApproval[] = [
  { id: "F001", name: "Dr. Eleanor Vance", email: "eleanor.v@example.com", department: "Physics" },
  { id: "F002", name: "Dr. Theodora Crain", email: "theo.c@example.com", department: "Literature" },
]
