import { useEffect, useState } from 'react'
import './Dashboard.css'

interface User {
  id: number
  email: string
}

function Dashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No token found')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:5168/stats/user-json-db', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.hash = '#signin'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
        <button onClick={handleLogout} className="logout-button">Back to Login</button>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>MealMajor Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h2>Registered Users</h2>
          <span className="user-count">{users.length} users</span>
        </div>
        
        {users.length === 0 ? (
          <div className="empty-state">
            <p>No users registered yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="id-column">ID</th>
                  <th className="email-column">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="id-cell">{user.id}</td>
                    <td className="email-cell">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
