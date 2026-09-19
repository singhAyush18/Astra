import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import './WeeklyChart.css';

function WeeklyChart({ runs }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDayIndex = (dateString) => {
    const d = new Date(dateString);
    let day = d.getDay() - 1;
    if (day === -1) day = 6; // Sunday
    return day;
  };

  const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const weekStart = getWeekStart();
  const weekRuns = runs?.filter(r => new Date(r.startTime) >= weekStart) || [];

  const data = Array(7).fill(0);
  let maxDistance = 0;

  weekRuns.forEach(run => {
    if (run.status === 'completed') {
      const idx = getDayIndex(run.startTime);
      data[idx] += run.distance;
      if (data[idx] > maxDistance) {
        maxDistance = data[idx];
      }
    }
  });

  return (
    <div className="weekly-chart-card">
      <div className="chart-header">
        <BarChart3 size={18} className="chart-icon" />
        <h3>This Week's Conquests</h3>
      </div>

      <div className="chart-container">
        {data.map((dist, idx) => {
          const heightPercent = maxDistance > 0 ? Math.max(8, (dist / maxDistance) * 100) : 0;
          const hasRun = dist > 0;
          return (
            <div key={days[idx]} className="chart-bar-group">
              {/* Dedicated number slot above the bar */}
              <div className="chart-val-slot">
                {hasRun ? `${dist.toFixed(1)} km` : ''}
              </div>

              <div className="chart-bar-wrapper">
                {hasRun ? (
                  <motion.div
                    className="chart-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.7, delay: idx * 0.08 }}
                  />
                ) : (
                  <div className="chart-bar-empty" />
                )}
              </div>

              <span className="chart-label">{days[idx]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklyChart;
