import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import api from '@/lib/apiConfig';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles')
      ]);
      setUsers(usersResponse.data.users);
      setRoles(rolesResponse.data.roles);
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
    </div>
  );
} 