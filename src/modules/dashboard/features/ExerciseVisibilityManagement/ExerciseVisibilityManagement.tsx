import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  message, 
  Tag,
  Space,
  Switch
} from 'antd';
import { 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { supabase } from '../../../../lib/supabase';
import { studentsApi } from '../../../../lib/api/students';
import './ExerciseVisibilityManagement.scss';

const { Option } = Select;

interface Exercise {
  id: string;
  name: string;
  difficulty?: string;
  chapter_id: string;
  chapter_title?: string;
  subject_title?: string;
  is_public: boolean;
  created_at: string;
}

const ExerciseVisibilityManagement: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    visibility: 'all' as 'all' | 'public' | 'private',
    search: ''
  });

  // Statistics
  const stats = {
    total: exercises.length,
    public: exercises.filter(e => e.is_public).length,
    private: exercises.filter(e => !e.is_public).length
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('exercises')
        .select(`
          id,
          name,
          difficulty,
          chapter_id,
          is_public,
          created_at,
          chapters!inner(title, subjects!inner(title))
        `);

      // Apply filters
      if (filters.visibility === 'public') {
        query = query.eq('is_public', true);
      } else if (filters.visibility === 'private') {
        query = query.eq('is_public', false);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data to include chapter and subject titles
      const transformedData = data?.map((exercise: any) => ({
        ...exercise,
        chapter_title: exercise.chapters?.title,
        subject_title: exercise.chapters?.subjects?.title
      })) || [];

      setExercises(transformedData);
    } catch (error) {
      message.error('Failed to fetch exercises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [filters]);

  const handleVisibilityToggle = async (exerciseId: string, checked: boolean) => {
    try {
      await studentsApi.updateExerciseVisibility(exerciseId, checked);
      message.success(`Exercise ${checked ? 'made public' : 'made private'} successfully`);
      fetchExercises();
    } catch (error) {
      message.error('Failed to update exercise visibility');
      console.error(error);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'orange';
      case 'hard':
        return 'red';
      default:
        return 'blue';
    }
  };

  const columns = [
    {
      title: 'Exercise',
      key: 'exercise',
      render: (record: Exercise) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.subject_title} → {record.chapter_title}
          </div>
        </div>
      ),
    },
    {
      title: 'Difficulty',
      key: 'difficulty',
      render: (record: Exercise) => (
        record.difficulty ? (
          <Tag color={getDifficultyColor(record.difficulty)}>
            {record.difficulty}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>Not set</span>
        )
      ),
    },
    {
      title: 'Visibility',
      key: 'visibility',
      render: (record: Exercise) => (
        <Tag color={record.is_public ? 'green' : 'orange'} icon={record.is_public ? <EyeOutlined /> : <EyeInvisibleOutlined />}>
          {record.is_public ? 'Public' : 'Private'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Exercise) => (
        <Space>
          <Switch
            checked={record.is_public}
            onChange={(checked) => handleVisibilityToggle(record.id, checked)}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.is_public ? 'Public' : 'Private'}
          </span>
        </Space>
      ),
    },
  ];

  return (
    <div className="exercise-visibility-management">
      <div className="page-header">
        <h1>Exercise Visibility Management</h1>
        <p>Manage which exercises are public or private</p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Exercises"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Public Exercises"
              value={stats.public}
              valueStyle={{ color: '#52c41a' }}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Private Exercises"
              value={stats.private}
              valueStyle={{ color: '#faad14' }}
              prefix={<EyeInvisibleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Select
              placeholder="Filter by visibility"
              value={filters.visibility}
              onChange={(value) => setFilters({ ...filters, visibility: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">All Exercises</Option>
              <Option value="public">Public Only</Option>
              <Option value="private">Private Only</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Input
              placeholder="Search exercises by name"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchExercises}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Exercises Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={exercises}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} exercises`,
          }}
        />
      </Card>
    </div>
  );
};

export default ExerciseVisibilityManagement; 