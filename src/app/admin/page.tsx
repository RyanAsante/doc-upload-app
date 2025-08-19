'use client';
// Updated admin dashboard with new manager application system
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  uploads: {
    id: string;
    title: string;
    name: string;
    imagePath: string;
    fileType: string;
    createdAt: string;
  }[];
}

interface ManagerApplication {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  managerName: string;
  managerEmail: string;
  activityType: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingManagers, setPendingManagers] = useState<ManagerApplication[]>([]);
  const [managerActivity, setManagerActivity] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'activity'>('users');

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 2 minutes (120000ms)
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 120000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, pendingRes, activityRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/pending-managers'),
        fetch('/api/admin/manager-activity')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      } else {
        console.error('Failed to fetch users:', usersRes.status);
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingManagers(pendingData.pendingManagers || []);
      } else {
        console.error('Failed to fetch pending managers:', pendingRes.status);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setManagerActivity(activityData.managerActivity || []);
      } else {
        console.error('Failed to fetch manager activity:', activityRes.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'name' | 'email') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);

    const sortedUsers = [...users].sort((a, b) => {
      const aValue = a[field].toLowerCase();
      const bValue = b[field].toLowerCase();
      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    setUsers(sortedUsers);
  };

  const handleApproveManager = async (applicationId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setLoading(true);
      
      const requestBody = {
        applicationId,
        action,
        adminId: 'admin', // You might want to get the actual admin ID
      };
      
      const response = await fetch('/api/admin/approve-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Show success message
        alert(`${action === 'APPROVE' ? 'Approved' : 'Rejected'} manager successfully!`);
        
        // Refresh the data to update the UI
        await fetchData();
      } else {
        const errorData = await response.json();
        console.error('Failed to approve/reject manager:', errorData);
        alert(`Failed to ${action.toLowerCase()} manager: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving manager:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate dynamic upload count for managers
  const getManagerUploadCount = (userId: string, userRole: string, staticUploadCount: number) => {
    if (userRole !== 'MANAGER') {
      return staticUploadCount; // Return static count for non-managers
    }
    
    // For managers, find their email and count UPLOAD actions minus DELETE actions
    const user = users.find(u => u.id === userId);
    if (!user) return staticUploadCount;
    
    const managerActions = managerActivity.filter(log => 
      log.managerEmail === user.email
    );
    
    const uploadCount = managerActions.filter(log => log.action === 'UPLOAD').length;
    const deleteCount = managerActions.filter(log => log.action === 'DELETE').length;
    
    return Math.max(0, uploadCount - deleteCount); // Ensure count doesn't go negative
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">


      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 sm:space-x-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="/AIS.jpg" 
                    alt="Asante International Shipping Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Asante International Shipping
                </span>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white/50 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'pending'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Managers ({pendingManagers.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'activity'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manager Activity
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-emerald-600 transition-colors"
                      >
                        <span>Name</span>
                        {sortField === 'name' && (
                          <span className="text-emerald-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center space-x-1 hover:text-emerald-600 transition-colors"
                      >
                        <span>Email</span>
                        {sortField === 'email' && (
                          <span className="text-emerald-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploads</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-900">
                        <div className="truncate max-w-xs">{user.name}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="truncate max-w-xs">{user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {getManagerUploadCount(user.id, user.role, user.uploads.length)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => router.push(`/admin/${user.id}`)}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all duration-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Pending Managers Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Manager Applications</h2>
            {pendingManagers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No pending manager applications</p>
            ) : (
              <div className="space-y-4">
                {pendingManagers.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-xl p-4 bg-white/50">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{application.name}</h3>
                        <p className="text-gray-600 truncate">{application.email}</p>
                        <p className="text-sm text-gray-500">
                          Applied: {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveManager(application.id, 'APPROVE')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveManager(application.id, 'REJECT')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manager Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manager Activity Logs</h2>
            {managerActivity.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No manager activity found</p>
            ) : (
              <div className="space-y-4">
                {managerActivity.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-xl p-4 bg-white/50">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{log.managerName || 'Unknown Manager'}</h3>
                        <p className="text-gray-600 truncate">{log.managerEmail || 'No email'}</p>
                        <p className="text-gray-800 mt-1 break-words">{log.details}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.action.includes('UPLOAD') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

