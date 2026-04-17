import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import api from "@/lib/apiConfig";
import { uploadTemplate, getTemplates, Template } from "@/lib/templateApi";
import {
  getDesignationVisibility,
  updateDesignationVisibility,
  DesignationVisibility,
} from "@/lib/associateApi";
import {
  AdminDepartment,
  AdminLocation,
  createDepartment,
  createLocation,
  deleteLocation,
  deleteDepartment,
  getAdminDepartments,
  getAdminLocations,
  updateDepartment,
  updateLocation,
} from "@/lib/locationDepartmentApi";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  Users,
  Shield,
  Database,
  AlertTriangle,
  FileText,
  RefreshCw,
  Mail,
  Send,
  Settings,
  Building2,
  MapPin,
  LayoutGrid,
} from "lucide-react";
import TemplateMappingConfig from "@/components/admin/TemplateMappingConfig";
// import { useAuth } from '@/contexts/AuthContext'; // Not currently used but available for future features

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isAdmin: boolean;
  roles: string[];
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

type AdminSection =
  | "users"
  | "roles"
  | "departments"
  | "locations"
  | "designations"
  | "templates"
  | "backup"
  | "email";

export default function AdminPage() {
  // const { user } = useAuth(); // Not currently used but available for future features
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    roles: [] as string[],
  });
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [uploadingTemplate, setUploadingTemplate] = useState<string | null>(
    null
  );
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<string>("");
  const [testEmailData, setTestEmailData] = useState({
    userEmail: "",
    userName: "",
    resetToken: "",
  });
  const [showPlaceholderWarning, setShowPlaceholderWarning] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [designationVisibility, setDesignationVisibility] = useState<
    DesignationVisibility[]
  >([]);
  const [designationDateDrafts, setDesignationDateDrafts] = useState<
    Record<string, string>
  >({});
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [showTemplateMappingConfig, setShowTemplateMappingConfig] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("users");

  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(
    null
  );
  const [editingDepartmentName, setEditingDepartmentName] = useState("");
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(
    null
  );

  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        usersResponse,
        rolesResponse,
        templatesResponse,
        designationsResponse,
        departmentsResponse,
        locationsResponse,
      ] =
        await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/roles"),
          getTemplates(),
          getDesignationVisibility(),
          getAdminDepartments(),
          getAdminLocations(),
        ]);
      setUsers(usersResponse.data.users);
      setRoles(rolesResponse.data.roles);
      setTemplates(templatesResponse);
      setDesignationVisibility(designationsResponse);
      const drafts: Record<string, string> = {};
      for (const d of designationsResponse) {
        drafts[d.designation] = d.pointTotalsEffectiveDate
          ? new Date(d.pointTotalsEffectiveDate).toISOString().slice(0, 10)
          : "";
      }
      setDesignationDateDrafts(drafts);
      setDepartments(departmentsResponse);
      setLocations(locationsResponse);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", newUser);
      toast.success("User created successfully");
      setNewUser({ email: "", name: "", password: "", roles: [] });
      setShowNewUserForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/roles", newRole);
      toast.success("Role created successfully");
      setNewRole({ name: "", description: "" });
      setShowNewRoleForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create role");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive });
      toast.success("User status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleToggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isAdmin });
      toast.success("Admin status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update admin status");
    }
  };

  const handleUpdateUserRoles = async (userId: string, roles: string[]) => {
    try {
      await api.patch(`/admin/users/${userId}/roles`, { roles });
      toast.success("User roles updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update user roles");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.patch(`/admin/users/${selectedUser.id}/password`, {
        password: newPassword,
      });
      toast.success("Password changed successfully");
      setNewPassword("");
      setSelectedUser(null);
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  const openPasswordForm = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordForm(true);
  };

  const handleTemplateUpload = async (type: "ca" | "occ", file: File) => {
    setUploadingTemplate(type);
    try {
      const result = await uploadTemplate(file);
      toast.success(result.message);
      await fetchData(); // Refresh templates
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload template");
    } finally {
      setUploadingTemplate(null);
    }
  };

  const handleTemplateFileSelect = (type: "ca" | "occ") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleTemplateUpload(type, file);
      }
    };
    input.click();
  };

  const getTemplateForType = (type: "ca" | "occ") => {
    return templates.find((template) =>
      template.filename.toLowerCase().includes(type === "ca" ? "ca" : "occ")
    );
  };

  const handleDownloadTemplate = async (type: "ca" | "occ") => {
    try {
      const response = await api.get(`/templates/${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await api.post("/admin/backup");

      if (response.data.success) {
        setBackupData(response.data);
        setShowBackupModal(true);
        toast.success("Backup created successfully");
      } else {
        toast.error(response.data.message || "Failed to create backup");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!backupData) return;

    const jsonData = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = backupData.filename || "company-backup.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setShowBackupModal(false);
    setBackupData(null);
  };

  const handleRestoreFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setRestoreFile(file);
        setShowRestoreModal(true);
      }
    };
    input.click();
  };

  const handleRestore = async () => {
    if (!restoreFile || restoreConfirmText !== "RESTORE") {
      toast.error('Please confirm the restore operation by typing "RESTORE"');
      return;
    }

    setIsRestoring(true);
    try {
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);

      if (!backupData.encryptedData) {
        toast.error("Invalid backup file format");
        return;
      }

      const response = await api.post("/admin/restore", {
        encryptedData: backupData.encryptedData,
        confirmRestore: true,
      });

      if (response.data.success) {
        toast.success("Data restored successfully");
        setShowRestoreModal(false);
        setRestoreFile(null);
        setRestoreConfirmText("");
        // Refresh the page to show restored data
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to restore data");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore data");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedEmailType) {
      toast.error("Please select an email type");
      return;
    }

    if (!testEmailData.userEmail) {
      toast.error("Email address is required");
      return;
    }

    // Check for missing required fields
    const missingFields: string[] = [];
    if (selectedEmailType === "welcome" && !testEmailData.userName) {
      missingFields.push("User Name");
    }
    if (selectedEmailType === "password-reset" && !testEmailData.resetToken) {
      missingFields.push("Reset Token");
    }
    if (
      selectedEmailType === "password-reset-success" &&
      !testEmailData.userName
    ) {
      missingFields.push("User Name");
    }

    if (missingFields.length > 0) {
      setShowPlaceholderWarning(true);
      return;
    }

    await sendTestEmail();
  };

  const sendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      // Use placeholder values if fields are empty
      const emailData = {
        emailType: selectedEmailType,
        userEmail: testEmailData.userEmail,
        userName: testEmailData.userName || "Test User",
        resetToken: testEmailData.resetToken || "test-reset-token-12345",
      };

      const response = await api.post("/admin/test-email", emailData);

      if (response.data.success) {
        toast.success(response.data.message || "Test email sent successfully");
        // Reset form
        setSelectedEmailType("");
        setTestEmailData({ userEmail: "", userName: "", resetToken: "" });
        setShowPlaceholderWarning(false);
      } else {
        toast.error(response.data.message || "Failed to send test email");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send test email");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleConfirmPlaceholderWarning = () => {
    setShowPlaceholderWarning(false);
    sendTestEmail();
  };

  const handleToggleDesignationVisibility = async (
    designation: string,
    isVisible: boolean
  ) => {
    try {
      setLoadingDesignations(true);
      await updateDesignationVisibility(designation, { isVisible });
      setDesignationVisibility((prev) =>
        prev.map((d) =>
          d.designation === designation ? { ...d, isVisible } : d
        )
      );
      toast.success("Designation visibility updated");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update designation visibility"
      );
    } finally {
      setLoadingDesignations(false);
    }
  };

  const handleSaveDesignationEffectiveDate = async (designation: string) => {
    const raw = (designationDateDrafts[designation] ?? "").trim();
    try {
      setLoadingDesignations(true);
      const updated = await updateDesignationVisibility(designation, {
        pointTotalsEffectiveDate: raw === "" ? null : raw,
      });
      setDesignationVisibility((prev) =>
        prev.map((d) =>
          d.designation === designation ? { ...d, ...updated } : d
        )
      );
      toast.success(`Point totals date saved for ${designation}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to save designation date"
      );
    } finally {
      setLoadingDesignations(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDepartmentName.trim();
    if (!name) return;

    try {
      setCreatingDepartment(true);
      const created = await createDepartment(name);
      setDepartments((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewDepartmentName("");
      toast.success("Department created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create department");
    } finally {
      setCreatingDepartment(false);
    }
  };

  const startEditDepartment = (dept: AdminDepartment) => {
    setEditingDepartmentId(dept.id);
    setEditingDepartmentName(dept.name);
  };

  const cancelEditDepartment = () => {
    setEditingDepartmentId(null);
    setEditingDepartmentName("");
  };

  const handleSaveDepartment = async () => {
    if (!editingDepartmentId) return;
    const name = editingDepartmentName.trim();
    if (!name) return;

    try {
      setSavingDepartment(true);
      const updated = await updateDepartment(editingDepartmentId, name);
      setDepartments((prev) =>
        prev
          .map((d) => (d.id === updated.id ? updated : d))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Department updated successfully");
      cancelEditDepartment();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update department");
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleDeleteDepartment = async (dept: AdminDepartment) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;

    try {
      setDeletingDepartmentId(dept.id);
      await deleteDepartment(dept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
      toast.success("Department deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete department");
    } finally {
      setDeletingDepartmentId(null);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLocationName.trim();
    if (!name) return;

    try {
      setCreatingLocation(true);
      const created = await createLocation(name);
      setLocations((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewLocationName("");
      toast.success("Location created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create location");
    } finally {
      setCreatingLocation(false);
    }
  };

  const startEditLocation = (loc: AdminLocation) => {
    setEditingLocationId(loc.id);
    setEditingLocationName(loc.name);
  };

  const cancelEditLocation = () => {
    setEditingLocationId(null);
    setEditingLocationName("");
  };

  const handleSaveLocation = async () => {
    if (!editingLocationId) return;
    const name = editingLocationName.trim();
    if (!name) return;

    try {
      setSavingLocation(true);
      const updated = await updateLocation(editingLocationId, name);
      setLocations((prev) =>
        prev
          .map((l) => (l.id === updated.id ? updated : l))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Location updated successfully");
      cancelEditLocation();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (loc: AdminLocation) => {
    if (!confirm(`Delete location "${loc.name}"?`)) return;

    try {
      setDeletingLocationId(loc.id);
      await deleteLocation(loc.id);
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
      toast.success("Location deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete location");
    } finally {
      setDeletingLocationId(null);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Portal</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowNewUserForm(true)}
            className="w-full sm:w-auto"
          >
            <Users className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button
            onClick={() => setShowNewRoleForm(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Shield className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Section Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeSection === "users" ? "default" : "outline"}
              onClick={() => setActiveSection("users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeSection === "roles" ? "default" : "outline"}
              onClick={() => setActiveSection("roles")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </Button>
            <Button
              variant={activeSection === "departments" ? "default" : "outline"}
              onClick={() => setActiveSection("departments")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Departments
            </Button>
            <Button
              variant={activeSection === "locations" ? "default" : "outline"}
              onClick={() => setActiveSection("locations")}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </Button>
            <Button
              variant={activeSection === "designations" ? "default" : "outline"}
              onClick={() => setActiveSection("designations")}
            >
              <Users className="h-4 w-4 mr-2" />
              Designations
            </Button>
            <Button
              variant={activeSection === "templates" ? "default" : "outline"}
              onClick={() => setActiveSection("templates")}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button
              variant={activeSection === "backup" ? "default" : "outline"}
              onClick={() => setActiveSection("backup")}
            >
              <Database className="h-4 w-4 mr-2" />
              Backup/Restore
            </Button>
            <Button
              variant={activeSection === "email" ? "default" : "outline"}
              onClick={() => setActiveSection("email")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Departments Section */}
      {activeSection === "departments" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDepartment} className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="New department name"
              />
              <Button type="submit" disabled={creatingDepartment || !newDepartmentName.trim()}>
                {creatingDepartment ? "Creating..." : "Add Department"}
              </Button>
            </form>

            <div className="space-y-2">
              {departments.map((dept) => {
                const isEditing = editingDepartmentId === dept.id;
                const isDeleting = deletingDepartmentId === dept.id;
                return (
                  <div
                    key={dept.id}
                    className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          value={editingDepartmentName}
                          onChange={(e) => setEditingDepartmentName(e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">{dept.name}</div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {dept.associateCount} associate{dept.associateCount === 1 ? "" : "s"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSaveDepartment}
                            disabled={savingDepartment || !editingDepartmentName.trim()}
                            className="w-full sm:w-auto"
                          >
                            {savingDepartment ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelEditDepartment}
                            className="w-full sm:w-auto"
                            disabled={savingDepartment}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => startEditDepartment(dept)}
                            className="w-full sm:w-auto"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDeleteDepartment(dept)}
                            className="w-full sm:w-auto"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {departments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No departments found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations Section */}
      {activeSection === "locations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateLocation}
              className="flex flex-col sm:flex-row gap-2 mb-4"
            >
              <Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="New location name"
              />
              <Button
                type="submit"
                disabled={creatingLocation || !newLocationName.trim()}
              >
                {creatingLocation ? "Creating..." : "Add Location"}
              </Button>
            </form>

            <div className="space-y-2">
              {locations.map((loc) => {
                const isEditing = editingLocationId === loc.id;
                const isDeleting = deletingLocationId === loc.id;
                return (
                  <div
                    key={loc.id}
                    className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          value={editingLocationName}
                          onChange={(e) => setEditingLocationName(e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">{loc.name}</div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {loc.associateCount} associate
                            {loc.associateCount === 1 ? "" : "s"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSaveLocation}
                            disabled={savingLocation || !editingLocationName.trim()}
                            className="w-full sm:w-auto"
                          >
                            {savingLocation ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelEditLocation}
                            className="w-full sm:w-auto"
                            disabled={savingLocation}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => startEditLocation(loc)}
                            className="w-full sm:w-auto"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDeleteLocation(loc)}
                            className="w-full sm:w-auto"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {locations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No locations found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Designation Management Section */}
      {activeSection === "designations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Designation Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control which designations appear in filters and selection dropdowns
                throughout the application. Disabled designations will be hidden from
                users but existing data will remain unchanged.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Point totals effective date</strong> (per designation): only
                occurrences on or after this date count toward totals for associates
                in that designation, unless an individual associate has their own
                override (Associates → Adjust points).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {designationVisibility.map((item) => (
                  <div
                    key={item.designation}
                    className="border rounded-lg p-4 flex flex-col gap-4 min-w-0"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">
                            {item.designation}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.isVisible ? "Visible" : "Hidden"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <Switch
                          checked={item.isVisible}
                          onCheckedChange={(checked) =>
                            handleToggleDesignationVisibility(
                              item.designation,
                              checked
                            )
                          }
                          disabled={loadingDesignations}
                        />
                        {item.isVisible ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-1 border-t border-border">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Point totals effective (inclusive)
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <Input
                          type="date"
                          className="w-full min-w-0 sm:max-w-[11rem]"
                          value={designationDateDrafts[item.designation] ?? ""}
                          onChange={(e) =>
                            setDesignationDateDrafts((prev) => ({
                              ...prev,
                              [item.designation]: e.target.value,
                            }))
                          }
                          disabled={loadingDesignations}
                        />
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={loadingDesignations}
                            onClick={() =>
                              handleSaveDesignationEffectiveDate(item.designation)
                            }
                          >
                            Save date
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={loadingDesignations}
                            onClick={() => {
                              setDesignationDateDrafts((prev) => ({
                                ...prev,
                                [item.designation]: "",
                              }));
                              void (async () => {
                                try {
                                  setLoadingDesignations(true);
                                  const updated =
                                    await updateDesignationVisibility(
                                      item.designation,
                                      { pointTotalsEffectiveDate: null }
                                    );
                                  setDesignationVisibility((prev) =>
                                    prev.map((d) =>
                                      d.designation === item.designation
                                        ? { ...d, ...updated }
                                        : d
                                    )
                                  );
                                  toast.success(
                                    `Cleared effective date for ${item.designation}`
                                  );
                                } catch (error: unknown) {
                                  const err = error as {
                                    response?: { data?: { message?: string } };
                                  };
                                  toast.error(
                                    err.response?.data?.message ||
                                      "Failed to clear date"
                                  );
                                } finally {
                                  setLoadingDesignations(false);
                                }
                              })();
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {designationVisibility.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No designations found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Management Section */}
      {activeSection === "templates" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Template Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Occurrence Template */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">Occurrence Template</h3>
                  <p className="text-sm text-gray-600">
                    Excel template for occurrence reports
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {getTemplateForType("occ") ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  onClick={() => handleTemplateFileSelect("occ")}
                  disabled={uploadingTemplate === "occ"}
                  className="flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingTemplate === "occ"
                    ? "Uploading..."
                    : "Upload Template"}
                </Button>
                {getTemplateForType("occ") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate("occ")}
                      className="flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Badge variant="secondary" className="self-center">
                      Template Available
                    </Badge>
                  </>
                )}
              </div>
              {getTemplateForType("occ") && (
                <div className="text-xs text-gray-500">
                  Last updated:{" "}
                  {new Date(
                    getTemplateForType("occ")!.createdAt
                  ).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Corrective Action Template */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">Corrective Action Template</h3>
                  <p className="text-sm text-gray-600">
                    Excel template for corrective action reports
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {getTemplateForType("ca") ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  onClick={() => handleTemplateFileSelect("ca")}
                  disabled={uploadingTemplate === "ca"}
                  className="flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingTemplate === "ca"
                    ? "Uploading..."
                    : "Upload Template"}
                </Button>
                {getTemplateForType("ca") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate("ca")}
                      className="flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Badge variant="secondary" className="self-center">
                      Template Available
                    </Badge>
                  </>
                )}
              </div>
              {getTemplateForType("ca") && (
                <div className="text-xs text-gray-500">
                  Last updated:{" "}
                  {new Date(
                    getTemplateForType("ca")!.createdAt
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Templates are stored directly in the
              database and will be used for generating Excel reports. Upload
              Excel files (.xlsx or .xls) with a maximum size of 10MB.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => setShowTemplateMappingConfig(true)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Template Mappings
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Configure which Excel cells correspond to which data points (e.g., associate name, location, etc.)
            </p>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Users Section */}
      {activeSection === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className="text-xs"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) =>
                            handleToggleUserStatus(user.id, checked)
                          }
                        />
                        <Label className="text-sm">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.isAdmin}
                          onCheckedChange={(checked) =>
                            handleToggleAdminStatus(user.id, checked)
                          }
                        />
                        <Label className="text-sm">Admin</Label>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPasswordForm(user)}
                          className="w-full sm:w-auto"
                        >
                          Change Password
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="w-full sm:w-auto"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Role Management */}
                  <div className="space-y-2">
                    <Label className="text-sm">Roles:</Label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <Button
                          key={role.id}
                          variant={
                            user.roles.includes(role.name) ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            const newRoles = user.roles.includes(role.name)
                              ? user.roles.filter((r) => r !== role.name)
                              : [...user.roles, role.name];
                            handleUpdateUserRoles(user.id, newRoles);
                          }}
                          className="text-xs"
                        >
                          {role.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Section */}
      {activeSection === "roles" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Testing Section */}
      {activeSection === "email" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailType">Email Type</Label>
                <Select
                  value={selectedEmailType}
                  onValueChange={setSelectedEmailType}
                >
                  <SelectTrigger id="emailType" className="mt-2">
                    <SelectValue placeholder="Select an email type to test" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="password-reset">
                      Password Reset Email
                    </SelectItem>
                    <SelectItem value="password-reset-success">
                      Password Reset Success Email
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedEmailType && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div>
                    <Label htmlFor="testUserEmail">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="testUserEmail"
                      type="email"
                      value={testEmailData.userEmail}
                      onChange={(e) =>
                        setTestEmailData({
                          ...testEmailData,
                          userEmail: e.target.value,
                        })
                      }
                      placeholder="test@example.com"
                      className="mt-2"
                    />
                  </div>

                  {(selectedEmailType === "welcome" ||
                    selectedEmailType === "password-reset-success") && (
                    <div>
                      <Label htmlFor="testUserName">User Name</Label>
                      <Input
                        id="testUserName"
                        type="text"
                        value={testEmailData.userName}
                        onChange={(e) =>
                          setTestEmailData({
                            ...testEmailData,
                            userName: e.target.value,
                          })
                        }
                        placeholder="Test User"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If not provided, "Test User" will be used
                      </p>
                    </div>
                  )}

                  {selectedEmailType === "password-reset" && (
                    <div>
                      <Label htmlFor="testResetToken">Reset Token</Label>
                      <Input
                        id="testResetToken"
                        type="text"
                        value={testEmailData.resetToken}
                        onChange={(e) =>
                          setTestEmailData({
                            ...testEmailData,
                            resetToken: e.target.value,
                          })
                        }
                        placeholder="test-reset-token-12345"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If not provided, "test-reset-token-12345" will be used
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail || !testEmailData.userEmail}
                    className="w-full sm:w-auto"
                  >
                    {isSendingTestEmail ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This tool allows you to test email
                  templates. If required fields are not provided, placeholder
                  values will be used and you will be warned before sending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup & Restore Section */}
      {activeSection === "backup" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Backup & Restore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Backup Section */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">Create Backup</h3>
                    <p className="text-sm text-gray-600">
                      Export all company data to encrypted JSON file
                    </p>
                  </div>
                  <Database className="h-5 w-5 text-blue-500 flex-shrink-0" />
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleCreateBackup}
                    disabled={isBackingUp}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isBackingUp ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Create Backup
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-gray-500">
                    <strong>Includes:</strong> All users, associates, occurrences,
                    corrective actions, notifications, files, and system data
                  </div>
                </div>
              </div>

              {/* Restore Section */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">Restore Data</h3>
                    <p className="text-sm text-gray-600">
                      Import data from backup file (⚠️ DESTRUCTIVE)
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleRestoreFileSelect}
                    disabled={isRestoring}
                    variant="destructive"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Select Backup File
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-red-600">
                    <strong>⚠️ Warning:</strong> This will completely replace all
                    current data
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Important:</strong> Backup files are encrypted and
                  contain sensitive data. Store them securely and never share them
                  with unauthorized parties. Restore operations will permanently
                  delete all existing data.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New User Modal */}
      {showNewUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Create User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewUserForm(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Role Modal */}
      {showNewRoleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Role</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription">Description</Label>
                  <Input
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Create Role
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewRoleForm(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordForm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Change Password for {selectedUser.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Change Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setSelectedUser(null);
                      setNewPassword("");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup Success Modal */}
      {showBackupModal && backupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Backup Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>Backup Details:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>
                        • Created:{" "}
                        {new Date(
                          backupData.metadata.createdAt
                        ).toLocaleString()}
                      </li>
                      <li>• Created by: {backupData.metadata.createdBy}</li>
                      <li>
                        • Total records:{" "}
                        {Object.values(backupData.metadata.recordCounts)
                          .map((count) => Number(count))
                          .reduce((a: number, b: number) => a + b, 0)}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Record Counts:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(backupData.metadata.recordCounts).map(
                      ([key, count]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleDownloadBackup}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Backup
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBackupModal(false);
                      setBackupData(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && restoreFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirm Data Restore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>⚠️ DANGER:</strong> This operation will permanently
                    delete ALL current data and replace it with the backup data.
                    This action cannot be undone.
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>File Selected:</strong> {restoreFile.name}
                    <br />
                    <strong>Size:</strong>{" "}
                    {(restoreFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmRestore">
                    To confirm this destructive operation, type{" "}
                    <strong>RESTORE</strong> in the box below:
                  </Label>
                  <Input
                    id="confirmRestore"
                    value={restoreConfirmText}
                    onChange={(e) => setRestoreConfirmText(e.target.value)}
                    placeholder="Type RESTORE to confirm"
                    className="border-red-300 focus:border-red-500"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Recommendation:</strong> Create a backup of your
                    current data before proceeding with the restore operation.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleRestore}
                    disabled={restoreConfirmText !== "RESTORE" || isRestoring}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Restoring Data...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Restore Data
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreFile(null);
                      setRestoreConfirmText("");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Placeholder Warning Modal */}
      {showPlaceholderWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                Missing Required Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>⚠️ Warning:</strong> Some required fields are
                    missing. The following placeholder values will be used:
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedEmailType === "welcome" &&
                    !testEmailData.userName && (
                      <div className="text-sm">
                        <strong>User Name:</strong> "Test User"
                      </div>
                    )}
                  {selectedEmailType === "password-reset" &&
                    !testEmailData.resetToken && (
                      <div className="text-sm">
                        <strong>Reset Token:</strong> "test-reset-token-12345"
                      </div>
                    )}
                  {selectedEmailType === "password-reset-success" &&
                    !testEmailData.userName && (
                      <div className="text-sm">
                        <strong>User Name:</strong> "Test User"
                      </div>
                    )}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> These are placeholder values for
                    testing purposes only. In production, all fields should be
                    properly filled.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleConfirmPlaceholderWarning}
                    disabled={isSendingTestEmail}
                    className="w-full sm:w-auto"
                  >
                    {isSendingTestEmail ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send with Placeholders
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPlaceholderWarning(false)}
                    disabled={isSendingTestEmail}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Mapping Config Modal */}
      <TemplateMappingConfig
        isOpen={showTemplateMappingConfig}
        onClose={() => setShowTemplateMappingConfig(false)}
      />
    </div>
  );
}
