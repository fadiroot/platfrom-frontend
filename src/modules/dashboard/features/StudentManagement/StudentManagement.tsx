import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  message, 
  Space, 
  Tag, 
  Tooltip,
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Badge,
  Divider
} from 'antd';
import { 
  UserAddOutlined, 
  UserDeleteOutlined, 
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { 
  getStudentProfiles, 
  activateStudentAccount, 
  deactivateStudentAccount,
  AdminStudentProfile,
  ActivateStudentRequest,
  DeactivateStudentRequest,
  StudentFilters
} from '../../../../lib/api/admin';
import './StudentManagement.scss';

const { Option } = Select;
const { TextArea } = Input;

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

  const [activateForm] = Form.useForm();
  const [deactivateForm] = Form.useForm();

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
      message.error(`Failed to fetch students: ${error.message || 'Unknown error'}`);
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const handleActivate = async (values: any) => {
    if (!selectedStudent) return;

    try {
      const request: ActivateStudentRequest = {
        student_profile_id: selectedStudent.profile_id,
        subscription_months: values.subscription_months,
        payment_amount: values.payment_amount,
        payment_method: values.payment_method,
        payment_notes: values.payment_notes
      };

      await activateStudentAccount(request);
      message.success('Student account activated successfully');
      setActivateModalVisible(false);
      activateForm.resetFields();
      fetchStudents();
    } catch (error: any) {
      message.error(`Failed to activate student account: ${error.message || 'Unknown error'}`);
      console.error(error);
    }
  };

  const handleDeactivate = async (values: any) => {
    if (!selectedStudent) return;

    try {
      const request: DeactivateStudentRequest = {
        student_profile_id: selectedStudent.profile_id,
        reason: values.reason
      };

      await deactivateStudentAccount(request);
      message.success('Student account deactivated successfully');
      setDeactivateModalVisible(false);
      deactivateForm.resetFields();
      fetchStudents();
    } catch (error: any) {
      message.error(`Failed to deactivate student account: ${error.message || 'Unknown error'}`);
      console.error(error);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge 
            status="success" 
            text={
              <Tag color="#52c41a" icon={<CheckCircleOutlined />} className="status-tag">
                Active
              </Tag>
            }
          />
        );
      case 'inactive':
        return (
          <Badge 
            status="error" 
            text={
              <Tag color="#ff4d4f" icon={<CloseCircleOutlined />} className="status-tag">
                Inactive
              </Tag>
            }
          />
        );
      case 'expired':
        return (
          <Badge 
            status="warning" 
            text={
              <Tag color="#faad14" icon={<ClockCircleOutlined />} className="status-tag">
                Expired
              </Tag>
            }
          />
        );
      default:
        return <Tag className="status-tag">Unknown</Tag>;
    }
  };

  const getPaymentStatusTag = (status: string) => {
    switch (status) {
      case 'paid':
        return <Tag color="#52c41a" className="payment-tag">Paid</Tag>;
      case 'pending':
        return <Tag color="#faad14" className="payment-tag">Pending</Tag>;
      case 'failed':
        return <Tag color="#ff4d4f" className="payment-tag">Failed</Tag>;
      case 'refunded':
        return <Tag color="#1890ff" className="payment-tag">Refunded</Tag>;
      default:
        return <Tag className="payment-tag">Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: 'Student',
      key: 'student',
      width: 250,
      render: (record: AdminStudentProfile) => (
        <div className="student-info">
          <div className="student-avatar">
            <Avatar 
              size={48} 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
          </div>
          <div className="student-details">
            <div className="student-name">
              {record.first_name} {record.last_name}
            </div>
            <div className="student-email">
              <MailOutlined /> {record.email}
            </div>
            {record.phone_number && (
              <div className="student-phone">
                <PhoneOutlined /> {record.phone_number}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level_title',
      key: 'level',
      width: 150,
      render: (level: string) => (
        <div className="level-info">
          <Tag color="#722ed1" className="level-tag">
            {level || 'Not assigned'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (record: AdminStudentProfile) => getStatusTag(record.account_status),
    },
    {
      title: 'Payment',
      key: 'payment',
      width: 150,
      render: (record: AdminStudentProfile) => (
        <div className="payment-info">
          {getPaymentStatusTag(record.payment_status)}
          {record.payment_amount && (
            <div className="payment-amount">
              <DollarOutlined /> ${record.payment_amount}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Subscription',
      key: 'subscription',
      width: 200,
      render: (record: AdminStudentProfile) => (
        <div className="subscription-info">
          {record.subscription_start_date && (
            <div className="subscription-date">
              <CalendarOutlined /> Start: {new Date(record.subscription_start_date).toLocaleDateString()}
            </div>
          )}
          {record.subscription_end_date && (
            <div className="subscription-date">
              <CalendarOutlined /> End: {new Date(record.subscription_end_date).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: AdminStudentProfile) => (
        <Space size="small" className="action-buttons">
          {record.account_status === 'inactive' && (
            <Tooltip title="Activate Account">
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                size="small"
                className="activate-btn"
                onClick={() => {
                  setSelectedStudent(record);
                  setActivateModalVisible(true);
                }}
              >
                Activate
              </Button>
            </Tooltip>
          )}
          {(record.account_status === 'active' || record.account_status === 'expired') && (
            <Tooltip title="Deactivate Account">
              <Button
                danger
                icon={<UserDeleteOutlined />}
                size="small"
                className="deactivate-btn"
                onClick={() => {
                  setSelectedStudent(record);
                  setDeactivateModalVisible(true);
                }}
              >
                Deactivate
              </Button>
            </Tooltip>
          )}
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              className="view-btn"
              onClick={() => {
                message.info('Student details view coming soon');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="student-management">
      <div className="page-header">
        <h1 className="page-title">Student Management</h1>
        <p className="page-description">
          Manage student accounts and subscriptions. Active students can access all exercises, inactive students can only access public exercises.
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card total-card">
            <Statistic
              title="Total Students"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card active-card">
            <Statistic
              title="Active Students"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card inactive-card">
            <Statistic
              title="Inactive Students"
              value={stats.inactive}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card expired-card">
            <Statistic
              title="Expired Subscriptions"
              value={stats.expired}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="filters-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              className="filter-select"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Filter by payment"
              value={filters.payment_status}
              onChange={(value) => setFilters({ ...filters, payment_status: value as 'pending' | 'paid' | 'failed' | 'refunded' | undefined })}
              allowClear
              className="filter-select"
            >
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="failed">Failed</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Button 
              icon={<SyncOutlined />}
              type="primary" 
              onClick={fetchStudents}
              loading={loading}
              className="refresh-btn"
              block
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Students Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={students}
          rowKey="profile_id"
          loading={loading}
          className="students-table"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} students`,
            className: 'table-pagination'
          }}
        />
      </Card>

      {/* Activate Student Modal */}
      <Modal
        title={
          <div className="modal-title">
            <UserAddOutlined className="modal-icon" />
            Activate Student Account
          </div>
        }
        open={activateModalVisible}
        onCancel={() => {
          setActivateModalVisible(false);
          activateForm.resetFields();
        }}
        footer={null}
        className="activate-modal"
        width={600}
      >
        <Form
          form={activateForm}
          layout="vertical"
          onFinish={handleActivate}
          className="modal-form"
        >
          <div className="student-summary">
            <Avatar 
              size={64} 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div className="student-info">
              <h3>{selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}</h3>
              <p>{selectedStudent?.email}</p>
            </div>
          </div>
          
          <Divider />

          <Form.Item
            label="Subscription Period (months)"
            name="subscription_months"
            rules={[{ required: true, message: 'Please enter subscription period' }]}
          >
            <InputNumber 
              min={1} 
              max={12} 
              className="form-input"
              placeholder="Enter number of months"
            />
          </Form.Item>

          <Form.Item
            label="Payment Amount"
            name="payment_amount"
          >
            <InputNumber
              min={0}
              step={0.01}
              prefix="$"
              className="form-input"
              placeholder="Enter payment amount"
            />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="payment_method"
          >
            <Select placeholder="Select payment method" className="form-select">
              <Option value="cash">Cash</Option>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="check">Check</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Payment Notes"
            name="payment_notes"
          >
            <TextArea 
              rows={3} 
              className="form-textarea"
              placeholder="Add any additional notes about the payment"
            />
          </Form.Item>

          <Form.Item className="modal-actions">
            <Space size="middle">
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<UserAddOutlined />}
                className="submit-btn"
              >
                Activate Account
              </Button>
              <Button 
                onClick={() => {
                  setActivateModalVisible(false);
                  activateForm.resetFields();
                }}
                className="cancel-btn"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Deactivate Student Modal */}
      <Modal
        title={
          <div className="modal-title">
            <UserDeleteOutlined className="modal-icon" />
            Deactivate Student Account
          </div>
        }
        open={deactivateModalVisible}
        onCancel={() => {
          setDeactivateModalVisible(false);
          deactivateForm.resetFields();
        }}
        footer={null}
        className="deactivate-modal"
        width={600}
      >
        <Form
          form={deactivateForm}
          layout="vertical"
          onFinish={handleDeactivate}
          className="modal-form"
        >
          <div className="student-summary">
            <Avatar 
              size={64} 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#ff4d4f' }}
            />
            <div className="student-info">
              <h3>{selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}</h3>
              <p>{selectedStudent?.email}</p>
            </div>
          </div>
          
          <Divider />

          <Form.Item
            label="Reason for Deactivation"
            name="reason"
          >
            <TextArea 
              rows={4} 
              className="form-textarea"
              placeholder="Please provide a reason for deactivation (optional)"
            />
          </Form.Item>

          <Form.Item className="modal-actions">
            <Space size="middle">
              <Button 
                danger 
                htmlType="submit"
                icon={<UserDeleteOutlined />}
                className="submit-btn-danger"
              >
                Deactivate Account
              </Button>
              <Button 
                onClick={() => {
                  setDeactivateModalVisible(false);
                  deactivateForm.resetFields();
                }}
                className="cancel-btn"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentManagement; 