import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import employeeRoutes from "./routes/employee.routes";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/error.middleware";
import departmentRoutes from "./routes/department.routes";
import masterDataRoutes from "./routes/master-data.routes";
import permissionRoutes from "./routes/permissions.routes";
import roleRoutes from "./routes/roles.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import documentRoutes from "./routes/document.routes";
import documentTypeRoutes from "./routes/document-type.routes";
import exitRequestRoutes from "./routes/exit-request.routes";
import leaveRoutes from "./routes/leave.routes";
import leaveTypeRoutes from "./routes/leave-type.routes";
import attendanceRoutes from "./routes/attendance.routes";
import payrollRoutes from "./routes/payroll.routes";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/exit-requests", exitRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/master-data", masterDataRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/document-types", documentTypeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);

app.use(errorHandler);

export default app;
