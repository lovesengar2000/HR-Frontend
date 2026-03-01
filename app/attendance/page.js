'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '../../lib/authAPI';
import Navbar from '../../components/Navbar';
import '../styles/dashboard.css';

export default function Attendance() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [clockStatus, setClockStatus] = useState('not-clocked-in');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/');
      return;
    }

    loadAttendance();
  }, [router]);

  const loadAttendance = async () => {
    try {
      const companyId = authAPI.getCompanyId();
      const userId = authAPI.getUserId();

      const result = await authAPI.getAttendance(companyId, userId);
      if (result.success) {
        setAttendance(result.data);
        // Check clock status for today
        const today = new Date().toDateString();
        const todayRecord = result.data.find(
          (a) => new Date(a.date).toDateString() === today
        );
        if (todayRecord?.clockOut) {
          setClockStatus('clocked-out');
        } else if (todayRecord?.clockIn) {
          setClockStatus('clocked-in');
        }
      } else {
        setMessage('Failed to load attendance');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.clockIn(companyId, userId);

      if (result.success) {
        setClockStatus('clocked-in');
        setMessage('Clocked in successfully');
        setTimeout(() => loadAttendance(), 1000);
      } else {
        setMessage('Failed to clock in');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.clockOut(companyId, userId);

      if (result.success) {
        setClockStatus('clocked-out');
        setMessage('Clocked out successfully');
        setTimeout(() => loadAttendance(), 1000);
      } else {
        setMessage('Failed to clock out');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        {message && <div className="alert">{message}</div>}

        <div className="welcome-section">
          <h1>Attendance Tracking</h1>
          <p>Your attendance and clock in/out records</p>
        </div>

        <div className="card full-width">
          <h3>Today's Status</h3>
          <div className="attendance-actions">
            <p className="status-display">Status: <strong>{clockStatus}</strong></p>
            <div className="button-group">
              {clockStatus === 'not-clocked-in' && (
                <button className="btn btn-primary" onClick={handleClockIn}>
                  Clock In
                </button>
              )}
              {clockStatus === 'clocked-in' && (
                <button className="btn btn-warning" onClick={handleClockOut}>
                  Clock Out
                </button>
              )}
              {clockStatus === 'clocked-out' && (
                <p className="info-text">You have clocked out for today</p>
              )}
            </div>
          </div>
        </div>

        {attendance.length > 0 ? (
          <div className="card full-width">
            <h3>Attendance History</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => {
                    const clockIn = record.clockIn ? new Date(record.clockIn) : null;
                    const clockOut = record.clockOut
                      ? new Date(record.clockOut)
                      : null;
                    const duration = clockIn && clockOut
                      ? Math.round((clockOut - clockIn) / (1000 * 60 * 60) * 100) / 100
                      : '-';

                    return (
                      <tr key={record.id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{clockIn ? clockIn.toLocaleTimeString() : '-'}</td>
                        <td>{clockOut ? clockOut.toLocaleTimeString() : '-'}</td>
                        <td>{typeof duration === 'number' ? `${duration} hrs` : duration}</td>
                        <td>{record.status || 'Present'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card full-width">
            <p className="no-data">No attendance records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
