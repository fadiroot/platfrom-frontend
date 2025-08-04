import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLevels } from '@/lib/api/levels'
import { getSubjects } from '@/lib/api/subjects'
import { getChapters } from '@/lib/api/chapters'
import { getExercises } from '@/lib/api/exercises'
import './AdminDashboard.scss'

interface DashboardStats {
  levels: number
  subjects: number
  chapters: number
  exercises: number
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    levels: 0,
    subjects: 0,
    chapters: 0,
    exercises: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [levels, subjects, chapters, exercises] = await Promise.all([
          getLevels(),
          getSubjects(),
          getChapters(),
          getExercises()
        ])

        setStats({
          levels: levels.length,
          subjects: subjects.length,
          chapters: chapters.length,
          exercises: exercises.length
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const adminCards = [
    {
      title: 'Niveaux',
      count: stats.levels,
      icon: '🎓',
      color: 'blue',
      path: '/admin/levels'
    },
    {
      title: 'Matières',
      count: stats.subjects,
      icon: '📚',
      color: 'green',
      path: '/admin/subjects'
    },
    {
      title: 'Chapitres',
      count: stats.chapters,
      icon: '📖',
      color: 'orange',
      path: '/admin/chapters'
    },
    {
      title: 'Exercices',
      count: stats.exercises,
      icon: '✏️',
      color: 'purple',
      path: '/admin/exercises'
    }
  ]

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Chargement des statistiques...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your educational content</p>
      </div>

      <div className="stats-grid">
        {adminCards.map((card, index) => (
          <div
            key={index}
            className={`stat-card ${card.color}`}
            onClick={() => navigate(card.path)}
          >
            <div className="card-content">
              <div className="card-number">{card.count}</div>
              <div className="card-title">{card.title}</div>
            </div>
            <div className="card-action">
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h2>Overview</h2>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="label">Total Content</span>
            <span className="value">{stats.levels + stats.subjects + stats.chapters + stats.exercises}</span>
          </div>
          <div className="summary-item">
            <span className="label">Avg Exercises/Chapter</span>
            <span className="value">{stats.chapters > 0 ? Math.round(stats.exercises / stats.chapters) : 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Avg Chapters/Subject</span>
            <span className="value">{stats.subjects > 0 ? Math.round(stats.chapters / stats.subjects) : 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
