import React from 'react'
import StudentExerciseList from '@/modules/exercises/components/StudentExerciseList'
import './StudentDashboard.scss'

interface StudentDashboardProps {
  chapterId?: string
  subjectId?: string
  levelId?: string
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  chapterId,
  subjectId,
  levelId
}) => {
  return (
    <div className="student-dashboard">
      <div className="student-dashboard__header">
        <h1>My Learning Dashboard</h1>
        <p>Access your exercises and track your progress</p>
      </div>
      
      <div className="student-dashboard__content">
        <StudentExerciseList 
          chapterId={chapterId}
          subjectId={subjectId}
          levelId={levelId}
        />
      </div>
    </div>
  )
}

export default StudentDashboard