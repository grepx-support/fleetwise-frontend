import { useState, useEffect } from 'react';
import { createUser, updateUser, getUnassignedDrivers, getUnassignedCustomers, assignCustomerOrDriver, getDriverById, getCustomerById } from '@/services/api/userApi';
import { User, Role } from '@/lib/types';
import { Driver } from '@/lib/types';
import { Customer } from '@/types/customer';
import { toast } from 'react-hot-toast';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface UserModalProps {
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSave: () => void;
}

export default function UserModal({ user, roles, onClose, onSave }: UserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // User type linking states
  const [userType, setUserType] = useState<'driver' | 'customer' | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setIsActive(user.active);
      // For single role selection, use the first role if available
      setSelectedRoleId(user.roles && user.roles.length > 0 ? user.roles[0].id : null);
      
      // Set user type based on existing data
      if (user.driver_id) {
        setUserType('driver');
        setSelectedDriverId(user.driver_id);
      } else if (user.customer_id) {
        setUserType('customer');
        setSelectedCustomerId(user.customer_id);
      }
    } else {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsActive(true);
      setSelectedRoleId(null);
      setUserType(null);
      setSelectedDriverId(null);
      setSelectedCustomerId(null);
    }
  }, [user]);

  // Fetch available drivers or customers when user type changes
  useEffect(() => {
    const fetchEntities = async () => {
      if (userType === 'driver') {
        setLoadingDrivers(true);
        try {
          const drivers = await getUnassignedDrivers();
          
          // If editing existing user with assigned driver, ensure that driver is included
          if (user && user.driver_id) {
            // Check if the assigned driver is in the unassigned list
            const assignedDriverExists = drivers.some(driver => driver.id === user.driver_id);
            if (!assignedDriverExists) {
              // If the assigned driver is not in the unassigned list, fetch it separately
              try {
                const assignedDriver = await getDriverById(user.driver_id);
                // Add the assigned driver to the beginning of the list
                setAvailableDrivers([assignedDriver, ...drivers]);
              } catch (driverError) {
                console.error('Error fetching assigned driver:', driverError);
                // Still set the unassigned drivers list
                setAvailableDrivers(drivers);
              }
            } else {
              setAvailableDrivers(drivers);
            }
          } else {
            setAvailableDrivers(drivers);
          }
        } catch (error) {
          toast.error('Failed to fetch drivers');
          console.error('Error fetching drivers:', error);
        } finally {
          setLoadingDrivers(false);
        }
      } else if (userType === 'customer') {
        setLoadingCustomers(true);
        try {
          const customers = await getUnassignedCustomers();
          
          // If editing existing user with assigned customer, ensure that customer is included
          if (user && user.customer_id) {
            // Check if the assigned customer is in the unassigned list
            const assignedCustomerExists = customers.some(customer => customer.id === user.customer_id);
            if (!assignedCustomerExists) {
              // If the assigned customer is not in the unassigned list, fetch it separately
              try {
                const assignedCustomer = await getCustomerById(user.customer_id);
                // Add the assigned customer to the beginning of the list
                setAvailableCustomers([assignedCustomer, ...customers]);
              } catch (customerError) {
                console.error('Error fetching assigned customer:', customerError);
                // Still set the unassigned customers list
                setAvailableCustomers(customers);
              }
            } else {
              setAvailableCustomers(customers);
            }
          } else {
            setAvailableCustomers(customers);
          }
        } catch (error) {
          toast.error('Failed to fetch customers');
          console.error('Error fetching customers:', error);
        } finally {
          setLoadingCustomers(false);
        }
      }
    };

    if (userType) {
      fetchEntities();
    }
  }, [userType, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email) {
      toast.error('Email is required');
      return;
    }
    
    if (!user && (!password || password !== confirmPassword)) {
      toast.error('Passwords must match');
      return;
    }
    
    // Validate user type selection
    if (userType && userType === 'driver' && !selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }
    
    if (userType && userType === 'customer' && !selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    
    setLoading(true);
    
    try {
      let userId: number;
      
      // Create or update user first
      if (user) {
        // Update existing user
        const userData: any = {
          email,
          active: isActive,
          role_names: selectedRoleId ? [roles.find(role => role.id === selectedRoleId)?.name].filter(Boolean) : []
        };
        
        const updatedUser = await updateUser(user.id, userData);
        userId = updatedUser.id;
        toast.success('User updated successfully');
      } else {
        // Create new user
        const userData: any = {
          email,
          active: isActive,
          role_names: selectedRoleId ? [roles.find(role => role.id === selectedRoleId)?.name].filter(Boolean) : []
        };
        
        // Include password only when creating a new user
        if (password) {
          userData.password = password;
        }
        
        const newUser = await createUser(userData);
        userId = newUser.id;
        toast.success('User created successfully');
      }
      
    
      if (userType === 'driver' && selectedDriverId) {
       
        if (!user || user.driver_id !== selectedDriverId) {
          await assignCustomerOrDriver(userId, 'driver', selectedDriverId);
          toast.success('Driver assigned successfully');
        }
      } else if (userType === 'customer' && selectedCustomerId) {
       
        if (!user || user.customer_id !== selectedCustomerId) {
          await assignCustomerOrDriver(userId, 'customer', selectedCustomerId);
          toast.success('Customer assigned successfully');
        }
      }
      
      onSave();
      onClose();
    } catch (error) {
      toast.error(user ? 'Failed to update user' : 'Failed to create user');
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId: number) => {
    // For radio buttons, directly set the selected role ID
    setSelectedRoleId(roleId);
    
    // Set user type based on role
    const role = roles.find(r => r.id === roleId);
    if (role) {
      if (role.name.toLowerCase() === 'driver') {
        setUserType('driver');
      } else if (role.name.toLowerCase() === 'customer') {
        setUserType('customer');
      } else {
        setUserType(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">
            {user ? 'Edit User' : 'Create User'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          
          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 pr-10 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required={!user}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 pr-10 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required={!user}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Roles
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded-lg">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`role-${role.id}`}
                    name="user-role"
                    checked={selectedRoleId === role.id}
                    onChange={() => handleRoleChange(role.id)}
                    className="h-4 w-4 text-blue-600 border-gray-600 bg-gray-700 focus:ring-blue-500"
                  />
                  <label 
                    htmlFor={`role-${role.id}`} 
                    className="ml-2 text-sm text-gray-300"
                  >
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* User Type Linking Section */}
          {selectedRoleId && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-md font-medium text-white mb-2">User Type Linking</h4>
              
              {userType === 'driver' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Select Driver
                  </label>
                  {loadingDrivers ? (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <select
                      value={selectedDriverId || ''}
                      onChange={(e) => setSelectedDriverId(Number(e.target.value) || null)}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select a driver</option>
                      {availableDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} {driver.email ? `(${driver.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              {userType === 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Select Customer
                  </label>
                  {loadingCustomers ? (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <select
                      value={selectedCustomerId || ''}
                      onChange={(e) => setSelectedCustomerId(Number(e.target.value) || null)}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select a customer</option>
                      {availableCustomers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.email ? `(${customer.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              {userType && userType !== 'driver' && userType !== 'customer' && (
                <div className="text-sm text-gray-400">
                  No additional linking required for this role type.
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-300">
              Active
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-medium shadow transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors flex items-center"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}