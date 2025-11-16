"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Workspace {
  id: string;
  name: string;
}

interface RoleAssignment {
  id: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  createdAt: string;
  user: User;
  workspace: Workspace | null;
  assignedByUser: User;
}

export default function RoleManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roles, setRoles] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userEmail: "",
    role: "VIEWER" as "ADMIN" | "EDITOR" | "VIEWER",
    workspaceId: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchRoles();
      fetchUsers();
      fetchWorkspaces();
    }
  }, [status]);

  async function fetchRoles() {
    try {
      const response = await fetch("/api/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else if (response.status === 403) {
        alert("You don't have permission to access this page");
        router.push("/entries");
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    // Placeholder - in a real app, you'd have a user search API
    // For now, users can type email directly
  }

  async function fetchWorkspaces() {
    try {
      const response = await fetch("/api/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  }

  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();

    // Find user by email
    const response = await fetch(`/api/users?email=${encodeURIComponent(assignForm.userEmail)}`);
    if (!response.ok) {
      alert("User not found");
      return;
    }

    const { user } = await response.json();

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: assignForm.role,
          workspaceId: assignForm.workspaceId || undefined,
        }),
      });

      if (response.ok) {
        setShowAssignForm(false);
        setAssignForm({ userEmail: "", role: "VIEWER", workspaceId: "" });
        await fetchRoles();
        alert("Role assigned successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to assign role");
      }
    } catch (error) {
      console.error("Failed to assign role:", error);
      alert("Failed to assign role");
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (!confirm("Are you sure you want to remove this role assignment?")) return;

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchRoles();
        alert("Role removed successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove role");
      }
    } catch (error) {
      console.error("Failed to remove role:", error);
      alert("Failed to remove role");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="flex justify-center py-12">
          <div className="text-muted-foreground">Loading roles...</div>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500 text-white";
      case "EDITOR":
        return "bg-blue-500 text-white";
      case "VIEWER":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
        >
          {showAssignForm ? "Cancel" : "Assign Role"}
        </button>
      </div>

      {/* Assign Role Form */}
      {showAssignForm && (
        <form onSubmit={handleAssignRole} className="bg-card border border-border rounded-lg p-6 mb-8 space-y-4">
          <h2 className="text-xl font-semibold text-card-foreground">Assign Role to User</h2>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">User Email</label>
            <input
              type="email"
              value={assignForm.userEmail}
              onChange={(e) => setAssignForm({ ...assignForm, userEmail: e.target.value })}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Role</label>
            <select
              value={assignForm.role}
              onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="VIEWER">Viewer (Read-only)</option>
              <option value="EDITOR">Editor (Can create and edit)</option>
              <option value="ADMIN">Admin (Full access)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Workspace (Optional - leave empty for global role)
            </label>
            <select
              value={assignForm.workspaceId}
              onChange={(e) => setAssignForm({ ...assignForm, workspaceId: e.target.value })}
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Global (All workspaces)</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
            >
              Assign Role
            </button>
            <button
              type="button"
              onClick={() => setShowAssignForm(false)}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Roles Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Workspace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No role assignments yet
                </td>
              </tr>
            ) : (
              roles.map((roleAssignment) => (
                <tr key={roleAssignment.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-card-foreground">
                        {roleAssignment.user.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">{roleAssignment.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                        roleAssignment.role
                      )}`}
                    >
                      {roleAssignment.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">
                    {roleAssignment.workspace?.name || <span className="italic text-muted-foreground">Global</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">
                    {roleAssignment.assignedByUser.name || roleAssignment.assignedByUser.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(roleAssignment.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteRole(roleAssignment.id)}
                      className="text-destructive hover:underline text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">👀 Viewer</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Read-only access to shared content</li>
            <li>• Can view and comment on entries</li>
            <li>• Cannot create or edit content</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">✍️ Editor</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Can create and edit entries</li>
            <li>• Can manage own content</li>
            <li>• Cannot manage users or system settings</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">👑 Admin</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Full system access</li>
            <li>• Can create, edit, and delete all content</li>
            <li>• Can manage roles and permissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
