import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();

app.use(cors(
/*{
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}*/));



app.use(express.json());

const employeeSchema = z.object({
  employeeId: z.string()
    .min(1, "EmployeeId must not be empty")
    .max(10, "Max 10 characters")
    .regex(/^\d{2}[A-Z]{2}\d{1,6}$/, "Invalid EmployeeId format"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  department: z.string().min(1, "Department is required"),
  dateOfJoining: z.string().refine(
    (date) => !isNaN(Date.parse(date)) && new Date(date) <= new Date(),
    "Date of joining must be valid and cannot be a future date"
  ),
  role: z.string().min(1, "Role is required"),
});

app.post("/api/employees", async (req, res) => {
  try {
    const validatedData = employeeSchema.parse(req.body);

    const dateOfJoining = new Date(validatedData.dateOfJoining);

    const newEmployee = await prisma.employee.create({
      data: {
        ...validatedData,
        dateOfJoining: dateOfJoining,
      },
    });

    res.status(201).json({ message: "Employee added successfully", newEmployee });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Duplicate entry detected. Check EmployeeId or Email." });
    }
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on http://localhost:${PORT}'));  