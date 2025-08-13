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
  Statistic
} from 'antd';
import { 
  UserAddOutlined, 
  UserDeleteOutlined, 
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
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
        return <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>;
      case 'inactive':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Inactive</Tag>;
      case 'expired':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Expired</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const getPaymentStatusTag = (status: string) => {
    switch (status) {
      case 'paid':
        return <Tag color="green">Paid</Tag>;
      case 'pending':
        return <Tag color="orange">Pending</Tag>;
      case 'failed':
        return <Tag color="red">Failed</Tag>;
      case 'refunded':
        return <Tag color="blue">Refunded</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (record: AdminStudentProfile) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.first_name} {record.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.email}
          </div>
          {record.phone_number && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.phone_number}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level_title',
      key: 'level',
      render: (level: string) => level || 'Not assigned',
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: AdminStudentProfile) => getStatusTag(record.account_status),
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (record: AdminStudentProfile) => (
        <div>
          {getPaymentStatusTag(record.payment_status)}
          {record.payment_amount && (
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              ${record.payment_amount}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Subscription',
      key: 'subscription',
      render: (record: AdminStudentProfile) => (
        <div>
          {record.subscription_start_date && (
            <div style={{ fontSize: '12px' }}>
              Start: {new Date(record.subscription_start_date).toLocaleDateString()}
            </div>
          )}
          {record.subscription_end_date && (
            <div style={{ fontSize: '12px' }}>
              End: {new Date(record.subscription_end_date).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: AdminStudentProfile) => (
        <Space>
          {record.account_status === 'inactive' && (
            <Tooltip title="Activate Account">
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                size="small"
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
              onClick={() => {
                // TODO: Implement student details view
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
        <h1>Student Management</h1>
        <p>Manage student accounts and subscriptions. Active students can access all exercises, inactive students can only access public exercises.</p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Students"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Inactive Students"
              value={stats.inactive}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Expired Subscriptions"
              value={stats.expired}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by payment"
              value={filters.payment_status}
              onChange={(value) => setFilters({ ...filters, payment_status: value as 'pending' | 'paid' | 'failed' | 'refunded' | undefined })}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="failed">Failed</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button 
                icon={<SyncOutlined />}
                type="primary" 
                onClick={fetchStudents}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Students Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="profile_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} students`,
          }}
        />
      </Card>

      {/* Activate Student Modal */}
      <Modal
        title="Activate Student Account"
        open={activateModalVisible}
        onCancel={() => {
          setActivateModalVisible(false);
          activateForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={activateForm}
          layout="vertical"
          onFinish={handleActivate}
        >
          <Form.Item
            label="Student"
            name="student"
          >
            <Input
              value={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.email})` : ''}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Subscription Period (months)"
            name="subscription_months"
            rules={[{ required: true, message: 'Please enter subscription period' }]}
          >
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Payment Amount"
            name="payment_amount"
          >
            <InputNumber
              min={0}
              step={0.01}
              prefix="$"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="payment_method"
          >
            <Select placeholder="Select payment method">
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
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Activate Account
              </Button>
              <Button onClick={() => {
                setActivateModalVisible(false);
                activateForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Deactivate Student Modal */}
      <Modal
        title="Deactivate Student Account"
        open={deactivateModalVisible}
        onCancel={() => {
          setDeactivateModalVisible(false);
          deactivateForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={deactivateForm}
          layout="vertical"
          onFinish={handleDeactivate}
        >
          <Form.Item
            label="Student"
            name="student"
          >
            <Input
              value={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.email})` : ''}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Reason for Deactivation"
            name="reason"
          >
            <TextArea rows={3} placeholder="Optional reason for deactivation" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button danger htmlType="submit">
                Deactivate Account
              </Button>
              <Button onClick={() => {
                setDeactivateModalVisible(false);
                deactivateForm.resetFields();
              }}>
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