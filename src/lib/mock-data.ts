export type Student = {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  age: number
  gender: "Male" | "Female" | "Other"
  birthday: string
  address: string
  guardian: {
    name: string
    relationship: string
    contactNumber: string
  }
  rfid: string | null
  sectionId?: string | null
  section?: string
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
  {
    id: "S001",
    firstName: "Alice",
    middleName: null,
    lastName: "Johnson",
    age: 20,
    gender: "Female",
    birthday: "2004-05-10",
    address: "123 University Ave, Learnington, ED 12345",
    guardian: {
      name: "Jane Johnson",
      relationship: "Mother",
      contactNumber: "555-123-4567",
    },
    rfid: "A1B2C3D4",
  },
  {
    id: "S002",
    firstName: "Bob",
    middleName: "K",
    lastName: "Williams",
    age: 21,
    gender: "Male",
    birthday: "2003-08-15",
    address: "456 College Rd, Studyville, ED 54321",
    guardian: {
      name: "Robert Williams Sr.",
      relationship: "Father",
      contactNumber: "555-987-6543",
    },
    rfid: null,
  },
  {
    id: "S003",
    firstName: "Charlie",
    middleName: null,
    lastName: "Brown",
    age: 22,
    gender: "Male",
    birthday: "2002-11-20",
    address: "789 Campus Dr, Knowledge City, ED 67890",
    guardian: {
      name: "Sally Brown",
      relationship: "Sister",
      contactNumber: "555-111-2222",
    },
    rfid: "E5F6G7H8",
  },
  {
    id: "S004",
    firstName: "Diana",
    middleName: "Grace",
    lastName: "Miller",
    age: 19,
    gender: "Female",
    birthday: "2005-02-25",
    address: "101 Library Ln, Wisdom Creek, ED 13579",
    guardian: {
      name: "George Miller",
      relationship: "Father",
      contactNumber: "555-333-4444",
    },
    rfid: "I9J0K1L2",
  },
  {
    id: "S005",
    firstName: "Ethan",
    middleName: null,
    lastName: "Davis",
    age: 20,
    gender: "Male",
    birthday: "2004-09-30",
    address: "210 Academy St, Intellectburg, ED 24680",
    guardian: {
      name: "Emily Davis",
      relationship: "Mother",
      contactNumber: "555-555-6666",
    },
    rfid: null,
  },
]

const today = new Date().toISOString().split("T")[0]
const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
  .toISOString()
  .split("T")[0]

export const mockAttendance: AttendanceRecord[] = [
  {
    id: "A001",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: today,
    timeIn: "08:55",
    timeOut: null,
    status: "Present",
  },
  {
    id: "A002",
    studentId: "S002",
    studentName: "Bob Williams",
    date: today,
    timeIn: null,
    timeOut: null,
    status: "Absent",
  },
  {
    id: "A003",
    studentId: "S003",
    studentName: "Charlie Brown",
    date: today,
    timeIn: "09:02",
    timeOut: "16:05",
    status: "Present",
  },
  {
    id: "A004",
    studentId: "S004",
    studentName: "Diana Miller",
    date: today,
    timeIn: "08:49",
    timeOut: null,
    status: "Present",
  },
  {
    id: "A005",
    studentId: "S005",
    studentName: "Ethan Davis",
    date: today,
    timeIn: null,
    timeOut: null,
    status: "Absent",
  },
  {
    id: "A006",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: yesterday,
    timeIn: "09:01",
    timeOut: "16:15",
    status: "Present",
  },
  {
    id: "A007",
    studentId: "S003",
    studentName: "Charlie Brown",
    date: yesterday,
    timeIn: "08:58",
    timeOut: "15:59",
    status: "Present",
  },
  {
    id: "A008",
    studentId: "S004",
    studentName: "Diana Miller",
    date: yesterday,
    timeIn: "09:05",
    timeOut: "16:01",
    status: "Present",
  },
]

export const mockStudentAttendance: AttendanceRecord[] = [
  {
    id: "A001",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: today,
    timeIn: "08:55",
    timeOut: "17:01",
    status: "Present",
  },
  {
    id: "A006",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: yesterday,
    timeIn: "09:01",
    timeOut: "16:15",
    status: "Present",
  },
  {
    id: "A009",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: "2023-10-25",
    timeIn: "08:59",
    timeOut: "16:00",
    status: "Present",
  },
  {
    id: "A010",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: "2023-10-24",
    timeIn: null,
    timeOut: null,
    status: "Absent",
  },
  {
    id: "A011",
    studentId: "S001",
    studentName: "Alice Johnson",
    date: "2023-10-23",
    timeIn: "09:03",
    timeOut: "16:20",
    status: "Present",
  },
]

export const mockFacultyApprovals: FacultyApproval[] = [
  {
    id: "F001",
    name: "Dr. Eleanor Vance",
    email: "eleanor.v@example.com",
    department: "Physics",
  },
  {
    id: "F002",
    name: "Dr. Theodora Crain",
    email: "theo.c@example.com",
    department: "Literature",
  },
]
