import React, { useState, useEffect } from 'react'
import { Search, Users, UserCheck, UserX, Calendar, Filter, CreditCard, Clock, AlertCircle, Eye, Edit, MoreHorizontal } from 'lucide-react'
import { Table, Input, Button, Tag, Space, Card, Row, Col, Statistic, Select, DatePicker, Tooltip, Avatar, Dropdown, Menu } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  getStudentProfiles,
  activateStudentAccount,
  deactivateStudentAccount,
  AdminStudentProfile,
  ActivateStudentRequest,
  DeactivateStudentRequest
} from '@/lib/api/admin'
import './UserManagement.scss'

const { Search: SearchInput } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface UserStats {
  total: number
  active: number
  inactive: number
  expired: number
}

interface ModalFormData {
  subscription_months: number
  payment_amount: number
  payment_method: string
  payment_notes: string
  reason: string
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminStudentProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminStudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0, expired: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminStudentProfile | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('activate')
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState<ModalFormData>({
    subscription_months: 1,
    payment_amount: 99.99,
    payment_method: 'credit_card',
    payment_notes: '',
    reason: ''
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getStudentProfiles()
      setUsers(data)
      setFilteredUsers(data)
      calculateStats(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: AdminStudentProfile[]) => {
    const total = data.length
    const active = data.filter(user => user.account_status === 'active').length
    const inactive = data.filter(user => user.account_status === 'inactive').length
    const expired = data.filter(user => user.account_status === 'expired').length
    setStats({ total, active, inactive, expired })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.account_status === statusFilter)
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(user => user.level_title === levelFilter)
    }

    // Date range filter
    if (dateRange) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at)
        const startDate = new Date(dateRange[0])
        const endDate = new Date(dateRange[1])
        return userDate >= startDate && userDate <= endDate
      })
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, levelFilter, dateRange])

  const handleUserAction = (user: AdminStudentProfile, action: 'activate' | 'deactivate') => {
    setSelectedUser(user)
    setActionType(action)
    setFormData({
      subscription_months: 1,
      payment_amount: 99.99,
      payment_method: 'credit_card',
      payment_notes: '',
      reason: ''
    })
    setShowModal(true)
  }

  const handleFormChange = (field: keyof ModalFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const confirmAction = async () => {
    if (!selectedUser) return

    try {
      setProcessing(true)
      
      console.log('Starting action:', actionType, 'for user:', selectedUser.user_id)
      
      if (actionType === 'activate') {
        const request: ActivateStudentRequest = {
          student_profile_id: selectedUser.user_id, // Use user_id instead of profile_id
          subscription_months: formData.subscription_months,
          payment_amount: formData.payment_amount,
          payment_method: formData.payment_method,
          payment_notes: formData.payment_notes
        }
        console.log('Activation request:', request)
        const result = await activateStudentAccount(request)
        console.log('Activation successful:', result)
      } else {
        const request: DeactivateStudentRequest = {
          student_profile_id: selectedUser.user_id, // Use user_id instead of profile_id
          reason: formData.reason
        }
        console.log('Deactivation request:', request)
        const result = await deactivateStudentAccount(request)
        console.log('Deactivation successful:', result)
      }
      
      // Refresh the user list
      await fetchUsers()
      
      // Close modal and reset form
      setShowModal(false)
      setSelectedUser(null)
      setFormData({
        subscription_months: 1,
        payment_amount: 99.99,
        payment_method: 'credit_card',
        payment_notes: '',
        reason: ''
      })
      
      // Show success message (you can add a toast notification here)
      console.log(`User ${actionType === 'activate' ? 'activated' : 'deactivated'} successfully`)
      
    } catch (error: any) {
      console.error('Error updating user status:', error)
      
      // Show error message to user (you can add a toast notification here)
      const errorMessage = error?.message || 'Failed to update user status'
      console.error('User-facing error:', errorMessage)
      
      // You can add a toast notification here:
      // toast.error(errorMessage)
      
    } finally {
      setProcessing(false)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="green">Active</Tag>
      case 'inactive':
        return <Tag color="red">Inactive</Tag>
      case 'expired':
        return <Tag color="orange">Expired</Tag>
      default:
        return <Tag color="default">Unknown</Tag>
    }
  }

  const getPaymentStatusTag = (status: string) => {
    switch (status) {
      case 'paid':
        return <Tag color="green">Paid</Tag>
      case 'pending':
        return <Tag color="orange">Pending</Tag>
      case 'failed':
        return <Tag color="red">Failed</Tag>
      default:
        return <Tag color="default">Unknown</Tag>
    }
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const calculateEndDate = () => {
    if (actionType === 'activate') {
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + formData.subscription_months)
      return endDate.toLocaleDateString()
    }
    return 'N/A'
  }

  const getLevels = () => {
    const levels = Array.from(new Set(users.map(user => user.level_title).filter(Boolean)))
    return levels
  }

  const columns: ColumnsType<AdminStudentProfile> = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <div className="student-info">
          <div>
            <div className="student-name">
              {record.first_name || record.last_name
                ? `${record.first_name || ''} ${record.last_name || ''}`.trim()
                : 'Unknown User'
              }
            </div>
            <div className="student-email">{record.email}</div>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Level',
      dataIndex: 'level_title',
      key: 'level',
      render: (level) => (
        <Tag color="blue">{level || 'Not assigned'}</Tag>
      ),
      width: 120,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div>
          {getStatusTag(record.account_status)}
          {getPaymentStatusTag(record.payment_status)}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Subscription',
      key: 'subscription',
      render: (_, record) => (
        <div className="subscription-info">
          <div>Start: {formatDate(record.subscription_start_date)}</div>
          <div>End: {formatDate(record.subscription_end_date)}</div>
        </div>
      ),
      width: 150,
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, record) => (
        <div className="payment-info">
          {record.payment_amount && (
            <div>${record.payment_amount}</div>
          )}
          {record.payment_method && (
            <Tag color="purple">{record.payment_method}</Tag>
          )}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created',
      render: (date) => formatDate(date),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.account_status === 'inactive' ? (
            <Tooltip title="Activate Account">
              <Button 
                type="primary" 
                icon={<UserCheck size={16} />} 
                size="small"
                onClick={() => handleUserAction(record, 'activate')}
              >
                Activate
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Deactivate Account">
              <Button 
                danger 
                icon={<UserX size={16} />} 
                size="small"
                onClick={() => handleUserAction(record, 'deactivate')}
              >
                Deactivate
              </Button>
            </Tooltip>
          )}
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="edit" icon={<Edit size={14} />}>
                  Edit Profile
                </Menu.Item>
                <Menu.Item key="history" icon={<Calendar size={14} />}>
                  View History
                </Menu.Item>
                <Menu.Item key="payment" icon={<CreditCard size={14} />}>
                  Payment History
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="text" icon={<MoreHorizontal size={16} />} size="small" />
          </Dropdown>
        </Space>
      ),
      width: 150,
      fixed: 'right',
    },
  ]

  return (
    <div className="user-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Users size={24} />
            <h1>Student Management</h1>
          </div>
          <div className="header-actions">
            <Button type="primary" icon={<UserCheck size={16} />}>
              Add Student
            </Button>
            <Button icon={<Filter size={16} />}>
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.total}
              prefix={<Users size={20} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Students"
              value={stats.active}
              prefix={<UserCheck size={20} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Inactive Students"
              value={stats.inactive}
              prefix={<UserX size={20} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Expired Subscriptions"
              value={stats.expired}
              prefix={<Clock size={20} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="filters-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <SearchInput
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Level"
              value={levelFilter}
              onChange={setLevelFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Levels</Option>
              {getLevels().map(level => (
                <Option key={level} value={level}>{level}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!.toISOString(), dates[1]!.toISOString()])
                } else {
                  setDateRange(null)
                }
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setLevelFilter('all')
                setDateRange(null)
              }}
              style={{ width: '100%' }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="profile_id"
          loading={loading}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`,
          }}
          scroll={{ x: 1200 }}
          className="students-table"
        />
      </Card>

      {/* Enhanced Confirmation Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content enhanced-modal">
            <div className="modal-header">
              <h3>
                {actionType === 'activate' ? (
                  <>
                    <UserCheck size={20} />
                    Activate User Account
                  </>
                ) : (
                  <>
                    <UserX size={20} />
                    Deactivate User Account
                  </>
                )}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={processing}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="user-info-card">
                <div className="user-avatar">
                  {selectedUser.first_name ? selectedUser.first_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <h4>
                    {selectedUser.first_name || selectedUser.last_name
                      ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()
                      : 'Unknown User'
                    }
                  </h4>
                  <p>{selectedUser.email}</p>
                  <p>Level: {selectedUser.level_title || 'Not assigned'}</p>
                </div>
              </div>

              {actionType === 'activate' ? (
                <div className="activation-form">
                  <div className="form-section">
                    <h4>Subscription Details</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Duration (months)</label>
                        <select
                          value={formData.subscription_months}
                          onChange={(e) => handleFormChange('subscription_months', parseInt(e.target.value))}
                          disabled={processing}
                        >
                          <option value={1}>1 Month</option>
                          <option value={3}>3 Months</option>
                          <option value={6}>6 Months</option>
                          <option value={12}>12 Months</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <div className="end-date-display">
                          <Clock size={16} />
                          {calculateEndDate()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Payment Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.payment_amount}
                          onChange={(e) => handleFormChange('payment_amount', parseFloat(e.target.value))}
                          disabled={processing}
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Method</label>
                        <select
                          value={formData.payment_method}
                          onChange={(e) => handleFormChange('payment_method', e.target.value)}
                          disabled={processing}
                        >
                          <option value="credit_card">Credit Card</option>
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                          <option value="admin_activation">Admin Activation</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Payment Notes</label>
                      <textarea
                        value={formData.payment_notes}
                        onChange={(e) => handleFormChange('payment_notes', e.target.value)}
                        placeholder="Optional notes about the payment..."
                        disabled={processing}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="deactivation-form">
                  <div className="warning-message">
                    <AlertCircle size={20} />
                    <p>This action will immediately deactivate the user's account and revoke access to premium content.</p>
                  </div>
                  <div className="form-group">
                    <label>Reason for Deactivation</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => handleFormChange('reason', e.target.value)}
                      placeholder="Optional reason for deactivation..."
                      disabled={processing}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className={`btn-confirm ${actionType === 'activate' ? 'btn-activate' : 'btn-deactivate'}`}
                onClick={confirmAction}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'activate' ? <UserCheck size={16} /> : <UserX size={16} />}
                    {actionType === 'activate' ? 'Activate Account' : 'Deactivate Account'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement