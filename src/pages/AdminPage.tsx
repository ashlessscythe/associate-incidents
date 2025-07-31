import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import api from '@/lib/apiConfig';
import { uploadTemplate, getTemplates, Template } from '@/lib/templateApi';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
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

export default function AdminPage() {
  // const { user } = useAuth(); // Not currently used but available for future features
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', roles: [] as string[] });
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [uploadingTemplate, setUploadingTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, rolesResponse, templatesResponse] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles'),
        getTemplates()
      ]);
      setUsers(usersResponse.data.users);
      setRoles(rolesResponse.data.roles);
      setTemplates(templatesResponse);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      toast.success('User created successfully');
      setNewUser({ email: '', name: '', password: '', roles: [] });
      setShowNewUserForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/roles', newRole);
      toast.success('Role created successfully');
      setNewRole({ name: '', description: '' });
      setShowNewRoleForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create role');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive });
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleToggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isAdmin });
      toast.success('Admin status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update admin status');
    }
  };

  const handleUpdateUserRoles = async (userId: string, roles: string[]) => {
    try {
      await api.patch(`/admin/users/${userId}/roles`, { roles });
      toast.success('User roles updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user roles');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await api.patch(`/admin/users/${selectedUser.id}/password`, { password: newPassword });
      toast.success('Password changed successfully');
      setNewPassword('');
      setSelectedUser(null);
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const openPasswordForm = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordForm(true);
  };

  const handleTemplateUpload = async (type: "ca" | "occ", file: File) => {
    setUploadingTemplate(type);
    try {
      const result = await uploadTemplate(file);
      toast.success(result.message);
      await fetchData(); // Refresh templates
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload template');
    } finally {
      setUploadingTemplate(null);
    }
  };

  const handleTemplateFileSelect = (type: "ca" | "occ") => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleTemplateUpload(type, file);
      }
    };
    input.click();
  };

  const getTemplateForType = (type: "ca" | "occ") => {
    return templates.find(template => 
      template.filename.toLowerCase().includes(type === "ca" ? "ca" : "occ")
    );
  };

  const handleDownloadTemplate = async (type: "ca" | "occ") => {
    try {
      const response = await api.get(`/templates/${type}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <div className="space-x-2">
          <Button onClick={() => setShowNewUserForm(true)}>Add User</Button>
          <Button onClick={() => setShowNewRoleForm(true)} variant="outline">Add Role</Button>
        </div>
      </div>

      {/* Template Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Template Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Occurrence Template */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Occurrence Template</h3>
                  <p className="text-sm text-gray-600">Excel template for occurrence reports</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTemplateForType("occ") ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleTemplateFileSelect("occ")}
                  disabled={uploadingTemplate === "occ"}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingTemplate === "occ" ? "Uploading..." : "Upload Template"}
                </Button>
                {getTemplateForType("occ") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate("occ")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Badge variant="secondary">Template Available</Badge>
                  </>
                )}
              </div>
              {getTemplateForType("occ") && (
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(getTemplateForType("occ")!.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Corrective Action Template */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Corrective Action Template</h3>
                  <p className="text-sm text-gray-600">Excel template for corrective action reports</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTemplateForType("ca") ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleTemplateFileSelect("ca")}
                  disabled={uploadingTemplate === "ca"}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingTemplate === "ca" ? "Uploading..." : "Upload Template"}
                </Button>
                {getTemplateForType("ca") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate("ca")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Badge variant="secondary">Template Available</Badge>
                  </>
                )}
              </div>
              {getTemplateForType("ca") && (
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(getTemplateForType("ca")!.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Templates are stored directly in the database and will be used for 
              generating Excel reports. Upload Excel files (.xlsx or .xls) with a maximum size of 10MB.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(checked) => handleToggleUserStatus(user.id, checked)}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.isAdmin}
                        onCheckedChange={(checked) => handleToggleAdminStatus(user.id, checked)}
                      />
                      <Label>Admin</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPasswordForm(user)}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                
                {/* Role Management */}
                <div className="space-y-2">
                  <Label>Roles:</Label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Button
                        key={role.id}
                        variant={user.roles.includes(role.name) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newRoles = user.roles.includes(role.name)
                            ? user.roles.filter(r => r !== role.name)
                            : [...user.roles, role.name];
                          handleUpdateUserRoles(user.id, newRoles);
                        }}
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

      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{role.name}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New User Modal */}
      {showNewUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
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
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create User</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewUserForm(false)}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
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
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription">Description</Label>
                  <Input
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Role</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewRoleForm(false)}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
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
                <div className="flex gap-2">
                  <Button type="submit">Change Password</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordForm(false);
                      setSelectedUser(null);
                      setNewPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 