import React, { useState, useEffect } from 'react';
import { 
  getStudentProfiles, 
  activateStudentAccount, 
  deactivateStudentAccount,
  AdminStudentProfile,
  ActivateStudentRequest,
  DeactivateStudentRequest,
  StudentFilters
} from '../../../../lib/api/admin';
import CustomSelect from '../../../shared/components/CustomSelect/CustomSelect';
import './StudentManagement.scss';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<AdminStudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentProfile | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({
    status: 'all',
    payment_status: undefined,
    search: ''
  });

  const [activateForm, setActivateForm] = useState({
    subscription_months: '',
    payment_amount: '',
    payment_method: '',
    payment_notes: ''
  });

  const [deactivateForm, setDeactivateForm] = useState({
    reason: ''
  });

  // Statistics
  const stats = {
    total: students.length,
    active: students.filter(s => s.account_status === 'active').length,
    inactive: students.filter(s => s.account_status === 'inactive').length,
    expired: students.filter(s => s.account_status === 'expired').length
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudentProfiles(filters);
      setStudents(data);
    } catch (error: any) {
      alert(`Failed to fetch students: ${error.message || 'Unknown error'}`);
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const request: ActivateStudentRequest = {
        student_profile_id: selectedStudent.profile_id,
        subscription_months: parseInt(activateForm.subscription_months),
        payment_amount: activateForm.payment_amount ? parseFloat(activateForm.payment_amount) : undefined,
        payment_method: activateForm.payment_method || undefined,
        payment_notes: activateForm.payment_notes || undefined
      };

      await activateStudentAccount(request);
      alert('Student account activated successfully');
      setActivateModalVisible(false);
      setActivateForm({
        subscription_months: '',
        payment_amount: '',
        payment_method: '',
        payment_notes: ''
      });
      fetchStudents();
    } catch (error: any) {
      alert(`Failed to activate student account: ${error.message || 'Unknown error'}`);
      console.error(error);
    }
  };

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const request: DeactivateStudentRequest = {
        student_profile_id: selectedStudent.profile_id,
        reason: deactivateForm.reason || undefined
      };

      await deactivateStudentAccount(request);
      alert('Student account deactivated successfully');
      setDeactivateModalVisible(false);
      setDeactivateForm({ reason: '' });
      fetchStudents();
    } catch (error: any) {
      alert(`Failed to deactivate student account: ${error.message || 'Unknown error'}`);
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active">✅ Active</span>;
      case 'inactive':
        return <span className="status-badge inactive">❌ Inactive</span>;
      case 'expired':
        return <span className="status-badge expired">⏰ Expired</span>;
      default:
        return <span className="status-badge unknown">❓ Unknown</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="payment-badge paid">💰 Paid</span>;
      case 'pending':
        return <span className="payment-badge pending">⏳ Pending</span>;
      case 'failed':
        return <span className="payment-badge failed">💥 Failed</span>;
      case 'refunded':
        return <span className="payment-badge refunded">↩️ Refunded</span>;
      default:
        return <span className="payment-badge unknown">❓ Unknown</span>;
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      payment_status: undefined,
      search: ''
    });
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      // Status filter
      if (filters.status !== 'all' && student.account_status !== filters.status) {
        return false;
      }
      
      // Payment status filter
      if (filters.payment_status && student.payment_status !== filters.payment_status) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        const email = student.email.toLowerCase();
        
        if (!fullName.includes(searchTerm) && !email.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  };

  return (
    <div className="student-management">
      <div className="page-header">
        <h1 className="page-title">Student Management</h1>
        <p className="page-description">
          Manage student accounts and subscriptions. Active students can access all exercises, inactive students can only access public exercises.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-row">
        <div className="stat-card total-card">
          <div className="stat-content">
            <h3>Total Students</h3>
            <p>{stats.total}</p>
            <span className="stat-icon">👥</span>
          </div>
        </div>
        <div className="stat-card active-card">
          <div className="stat-content">
            <h3>Active Students</h3>
            <p>{stats.active}</p>
            <span className="stat-icon">✅</span>
          </div>
        </div>
        <div className="stat-card inactive-card">
          <div className="stat-content">
            <h3>Inactive Students</h3>
            <p>{stats.inactive}</p>
            <span className="stat-icon">❌</span>
          </div>
        </div>
        <div className="stat-card expired-card">
          <div className="stat-content">
            <h3>Expired Subscriptions</h3>
            <p>{stats.expired}</p>
            <span className="stat-icon">⏰</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-content">
          <div className="filter-item">
            <CustomSelect
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value: string) => setFilters({ ...filters, status: value as 'all' | 'active' | 'inactive' | 'expired' })}
              onBlur={() => {}}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' }
              ]}
            />
          </div>
          <div className="filter-item">
            <CustomSelect
              placeholder="Filter by payment"
              value={filters.payment_status || ''}
              onChange={(value: string) => setFilters({ ...filters, payment_status: value as 'pending' | 'paid' | 'failed' | 'refunded' | undefined })}
              onBlur={() => {}}
              options={[
                { value: '', label: 'All Payments' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' }
              ]}
            />
          </div>
          <div className="filter-item search-filter">
            <input
              type="text"
              placeholder="Search by name or email"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-item clear-filters">
            <button onClick={clearFilters} disabled={filters.status === 'all' && filters.payment_status === undefined && filters.search === ''}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-card">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Level</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Subscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredStudents().map(student => (
              <tr key={student.profile_id}>
                <td className="student-cell">
                  <div className="student-info">
                    <div className="student-details">
                      <div className="student-name">{student.first_name} {student.last_name}</div>
                      <div className="student-email"><span className="icon-text">📧</span> {student.email}</div>
                      {student.phone_number && <div className="student-phone"><span className="icon-text">📞</span> {student.phone_number}</div>}
                    </div>
                  </div>
                </td>
                <td className="level-cell">
                  <div className="level-info">
                    <span className="level-badge">
                      {student.level_title || 'Not assigned'}
                    </span>
                  </div>
                </td>
                <td className="status-cell">
                  <div className="status-info">
                    {getStatusBadge(student.account_status)}
                  </div>
                </td>
                <td className="payment-cell">
                  <div className="payment-info">
                    {getPaymentStatusBadge(student.payment_status)}
                    {student.payment_amount && (
                      <div className="payment-amount">
                        <span className="icon-text">💰</span> ${student.payment_amount}
                      </div>
                    )}
                  </div>
                </td>
                <td className="subscription-cell">
                  <div className="subscription-info">
                    {student.subscription_start_date && (
                      <div className="subscription-date">
                        <span className="icon-text">📅</span> Start: {new Date(student.subscription_start_date).toLocaleDateString()}
                      </div>
                    )}
                    {student.subscription_end_date && (
                      <div className="subscription-date">
                        <span className="icon-text">📅</span> End: {new Date(student.subscription_end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    {student.account_status === 'inactive' && (
                      <button className="activate-btn" onClick={() => {
                        setSelectedStudent(student);
                        setActivateModalVisible(true);
                      }}>
                        Activate
                      </button>
                    )}
                    {(student.account_status === 'active' || student.account_status === 'expired') && (
                      <button className="deactivate-btn" onClick={() => {
                        setSelectedStudent(student);
                        setDeactivateModalVisible(true);
                      }}>
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activate Student Modal */}
      <div className={`modal-overlay ${activateModalVisible ? 'active' : ''}`}>
        <div className="modal-content">
          <h2>Activate Student Account</h2>
          <div className="student-summary">
            <div className="student-info">
              <h3>{selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}</h3>
              <p>{selectedStudent?.email}</p>
            </div>
          </div>
          
          <div className="divider"></div>

          <form onSubmit={handleActivate} className="modal-form">
            <div className="form-group">
              <label>Subscription Period (months)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={activateForm.subscription_months}
                onChange={(e) => setActivateForm({ ...activateForm, subscription_months: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={activateForm.payment_amount}
                onChange={(e) => setActivateForm({ ...activateForm, payment_amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={activateForm.payment_method}
                onChange={(e) => setActivateForm({ ...activateForm, payment_method: e.target.value })}
              >
                <option value="">Select payment method</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Notes</label>
              <textarea
                rows={3}
                value={activateForm.payment_notes}
                onChange={(e) => setActivateForm({ ...activateForm, payment_notes: e.target.value })}
                placeholder="Add any additional notes about the payment"
              ></textarea>
            </div>

            <div className="modal-actions">
              <button type="submit" className="submit-btn">
                Activate Account
              </button>
              <button type="button" className="cancel-btn" onClick={() => {
                setActivateModalVisible(false);
                setActivateForm({
                  subscription_months: '',
                  payment_amount: '',
                  payment_method: '',
                  payment_notes: ''
                });
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Deactivate Student Modal */}
      <div className={`modal-overlay ${deactivateModalVisible ? 'active' : ''}`}>
        <div className="modal-content">
          <h2>Deactivate Student Account</h2>
          <div className="student-summary">
            <div className="student-info">
              <h3>{selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}</h3>
              <p>{selectedStudent?.email}</p>
            </div>
          </div>
          
          <div className="divider"></div>

          <form onSubmit={handleDeactivate} className="modal-form">
            <div className="form-group">
              <label>Reason for Deactivation</label>
              <textarea
                rows={4}
                value={deactivateForm.reason}
                onChange={(e) => setDeactivateForm({ reason: e.target.value })}
                placeholder="Please provide a reason for deactivation (optional)"
              ></textarea>
            </div>

            <div className="modal-actions">
              <button type="submit" className="submit-btn-danger">
                Deactivate Account
              </button>
              <button type="button" className="cancel-btn" onClick={() => {
                setDeactivateModalVisible(false);
                setDeactivateForm({ reason: '' });
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement; 