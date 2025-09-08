import { useState } from "react";
import { Search, Users, Filter, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface User {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  position: string;
  taskRole: string;
  menuModules: string[];
  department: string;
  status: "active" | "inactive";
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    mobileNumber: "+1 (555) 123-4567",
    email: "john.smith@company.com",
    position: "Senior Developer",
    taskRole: "Full Stack Development",
    menuModules: ["Dashboard", "Projects", "Analytics", "Settings"],
    department: "Engineering",
    status: "active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    mobileNumber: "+1 (555) 987-6543",
    email: "sarah.johnson@company.com",
    position: "Product Manager",
    taskRole: "Product Strategy & Planning",
    menuModules: ["Dashboard", "Products", "Analytics", "Reports"],
    department: "Product",
    status: "active",
  },
  {
    id: "3",
    name: "Michael Davis",
    mobileNumber: "+1 (555) 456-7890",
    email: "michael.davis@company.com",
    position: "UX Designer",
    taskRole: "User Experience Design",
    menuModules: ["Dashboard", "Design", "Prototypes"],
    department: "Design",
    status: "active",
  },
  {
    id: "4",
    name: "Emily Wilson",
    mobileNumber: "+1 (555) 234-5678",
    email: "emily.wilson@company.com",
    position: "Marketing Specialist",
    taskRole: "Digital Marketing & Campaigns",
    menuModules: ["Dashboard", "Campaigns", "Analytics", "Social Media"],
    department: "Marketing",
    status: "active",
  },
  {
    id: "5",
    name: "David Brown",
    mobileNumber: "+1 (555) 345-6789",
    email: "david.brown@company.com",
    position: "Data Analyst",
    taskRole: "Business Intelligence & Reporting",
    menuModules: ["Dashboard", "Analytics", "Reports", "Data Tools"],
    department: "Analytics",
    status: "inactive",
  },
  {
    id: "6",
    name: "Lisa Garcia",
    mobileNumber: "+1 (555) 567-8901",
    email: "lisa.garcia@company.com",
    position: "HR Manager",
    taskRole: "Human Resources Management",
    menuModules: ["Dashboard", "Employees", "Payroll", "Benefits"],
    department: "Human Resources",
    status: "active",
  },
  {
    id: "7",
    name: "James Taylor",
    mobileNumber: "+1 (555) 678-9012",
    email: "james.taylor@company.com",
    position: "DevOps Engineer",
    taskRole: "Infrastructure & Deployment",
    menuModules: ["Dashboard", "Infrastructure", "Monitoring", "Deployments"],
    department: "Engineering",
    status: "active",
  },
  {
    id: "8",
    name: "Anna Martinez",
    mobileNumber: "+1 (555) 789-0123",
    email: "anna.martinez@company.com",
    position: "Quality Assurance Lead",
    taskRole: "Testing & Quality Control",
    menuModules: ["Dashboard", "Testing", "Reports", "Automation"],
    department: "Quality Assurance",
    status: "active",
  },
];

const departments = [
  "All",
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Analytics",
  "Human Resources",
  "Quality Assurance",
];

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "All" || user.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-muted-foreground">
              Manage all user accounts and permissions
            </p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold">{mockUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-semibold text-green-600">
                  {mockUsers.filter((user) => user.status === "active").length}
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Users</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {
                    mockUsers.filter((user) => user.status === "inactive")
                      .length
                  }
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-semibold">
                  {departments.length - 1}
                </p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, position, or department..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map((dept) => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment(dept)}>
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Task/Role</TableHead>
                  <TableHead>Menu/Modules</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.mobileNumber}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.position}</TableCell>
                    <TableCell>{user.taskRole}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.menuModules.map((module, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className={
                          user.status === "active"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-orange-500 hover:bg-orange-600"
                        }>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3>No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
