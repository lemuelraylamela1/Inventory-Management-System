"use client";

import { useEffect, useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { toast } from "react-hot-toast";

interface User {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  role: "SYSTEM_ADMIN" | "MANAGER" | "USER";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

// ... imports remain the same

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SYSTEM_ADMIN" | "MANAGER" | "USER">("USER");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [creating, setCreating] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<"SYSTEM_ADMIN" | "MANAGER" | "USER">(
    "USER"
  );
  const [editPassword, setEditPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!fullName || !email || !password) {
      toast.error("Please fill all required fields");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role, status }),
      });
      if (!res.ok) throw new Error("Failed to create user");
      toast.success("User created successfully!");
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      setStatus("active");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          password: editPassword || undefined, // only update if changed
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      toast.success("User updated successfully!");
      setEditingUser(null);
      setEditPassword("");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="p-6">Loading users...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Create User Dialog (same as before) */}
      {/* ... */}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.status}</TableCell>
                    <TableCell>
                      <Dialog
                        open={editingUser?._id === u._id}
                        onOpenChange={(open) => {
                          if (!open) setEditingUser(null);
                        }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingUser(u);
                              setEditRole(u.role);
                            }}>
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <select
                              value={editRole}
                              onChange={(e) =>
                                setEditRole(
                                  e.target.value as
                                    | "SYSTEM_ADMIN"
                                    | "MANAGER"
                                    | "USER"
                                )
                              }
                              className="w-full border p-2 rounded">
                              <option value="USER">USER</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                            </select>
                            <Input
                              type="password"
                              placeholder="New Password (leave blank to keep)"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                            />
                            <Button
                              onClick={handleUpdateUser}
                              disabled={updating}
                              className="w-full">
                              {updating ? "Updating..." : "Update User"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
