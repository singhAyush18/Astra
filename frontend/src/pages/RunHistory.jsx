import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scroll, MapPin, Clock, Gauge, Trash2, ChevronDown,
  ChevronUp, Filter, Calendar, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import "./RunHistory.css";
import { useAuth } from "../context/AuthContext";
import { runsAPI, statsAPI } from "../api";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const statusConfig = {
  completed: { label: "Completed", icon: <CheckCircle size={14} />, className: "status-completed" },
  active: { label: "Active", icon: <AlertCircle size={14} />, className: "status-active" },
  discarded: { label: "Discarded", icon: <XCircle size={14} />, className: "status-discarded" },
};

function RunHistory() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedRun, setExpandedRun] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();

  const { user, handleUnauthorized } = useAuth();

  const fetchRuns = () => {
    if (!user) return;

    setLoading(true);
    runsAPI.getAll(null)
      .then((res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          const sorted = (data.data.runs || []).sort(
            (a, b) => new Date(b.startTime) - new Date(a.startTime)
          );
          setRuns(sorted);
        } else {
          setError("Failed to load runs");
        }
      })
      .catch(() => setError("Something went wrong"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRuns();

    // Fetch streak for navbar flame
    if (user) {
      statsAPI.getGamification(null)
        .then(res => res.json())
        .then(data => {
          if (data?.success) setStreak(data.data.currentStreak || 0);
        })
        .catch(() => {});
    }
  }, [navigate]);

  const handleDelete = async (runId) => {
    setDeleting(true);

    try {
      const res = await runsAPI.delete(null, runId);

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (data.success) {
        setRuns((prev) => prev.filter((r) => r._id !== runId));
        setDeleteConfirm(null);
        setExpandedRun(null);
        toast.success("Run deleted successfully");
      } else {
        setError(data.message || "Failed to delete");
        toast.error("Failed to delete run");
      }
    } catch {
      setError("Error deleting run");
      toast.error("Error deleting run");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRuns = filter === "all"
    ? runs
    : runs.filter((r) => r.status === filter);

  const totalCompleted = runs.filter((r) => r.status === "completed").length;
  const totalDistance = runs
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.distance, 0);

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loading-spinner" />
        <p>Retrieving your chronicles...</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <Navbar streak={streak} />

      <main className="history-main">
        {/* Header */}
        <motion.header
          className="history-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-icon">
            <Scroll size={40} />
          </div>
          <h1 className="gold-text">Battle Chronicles</h1>
          <p className="subtitle">Every stride tells a story</p>
        </motion.header>

        {/* Summary Bar */}
        <motion.div
          className="history-summary ornate-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="summary-stat">
            <span className="summary-value">{totalCompleted}</span>
            <span className="summary-label">Runs Completed</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-stat">
            <span className="summary-value">{totalDistance.toFixed(1)}</span>
            <span className="summary-label">Total km</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-stat">
            <span className="summary-value">{runs.length}</span>
            <span className="summary-label">Total Entries</span>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          className="filter-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Filter size={16} className="filter-icon" />
          {["all", "completed", "active", "discarded"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && (
                <span className="filter-count">
                  {runs.filter((r) => f === "all" || r.status === f).length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {error && <p className="history-error">{error}</p>}

        {/* Empty State */}
        {filteredRuns.length === 0 && !error && (
          <motion.div
            className="history-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Scroll size={64} className="empty-icon" />
            <h3>No Chronicles Found</h3>
            <p>
              {filter === "all"
                ? "Your saga begins with the first run. Go forth, warrior!"
                : `No ${filter} runs found.`}
            </p>
          </motion.div>
        )}

        {/* Run Cards */}
        <div className="runs-list">
          <AnimatePresence mode="popLayout">
            {filteredRuns.map((run, idx) => {
              const status = statusConfig[run.status] || statusConfig.active;
              const isExpanded = expandedRun === run._id;
              const isDeleting = deleteConfirm === run._id;

              return (
                <motion.div
                  key={run._id}
                  className={`run-card ${isExpanded ? "expanded" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  layout
                >
                  {/* Card Header — always visible */}
                  <div
                    className="run-card-header"
                    onClick={() => setExpandedRun(isExpanded ? null : run._id)}
                  >
                    <div className="run-date-block">
                      <Calendar size={14} className="date-icon" />
                      <div className="run-date-info">
                        <span className="run-date">{formatDate(run.startTime)}</span>
                        <span className="run-time">{formatTime(run.startTime)}</span>
                      </div>
                    </div>

                    <div className="run-quick-stats">
                      <div className="quick-stat">
                        <MapPin size={14} />
                        <span>{run.distance.toFixed(2)} km</span>
                      </div>
                      <div className="quick-stat">
                        <Clock size={14} />
                        <span>{formatDuration(run.duration)}</span>
                      </div>
                      {run.pace && run.pace !== "0:00 min/km" && (
                        <div className="quick-stat">
                          <Gauge size={14} />
                          <span>{run.pace}</span>
                        </div>
                      )}
                    </div>

                    <div className="run-card-right">
                      <span className={`status-badge ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <button className="expand-btn" aria-label="Toggle details">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="run-card-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Distance</span>
                            <span className="detail-value">{run.distance.toFixed(2)} km</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">{formatDuration(run.duration)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Pace</span>
                            <span className="detail-value">{run.pace || "—"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Start Time</span>
                            <span className="detail-value">
                              {formatDate(run.startTime)} {formatTime(run.startTime)}
                            </span>
                          </div>
                          {run.endTime && (
                            <div className="detail-item">
                              <span className="detail-label">End Time</span>
                              <span className="detail-value">
                                {formatDate(run.endTime)} {formatTime(run.endTime)}
                              </span>
                            </div>
                          )}
                          <div className="detail-item">
                            <span className="detail-label">Path Points</span>
                            <span className="detail-value">{run.path?.length || 0}</span>
                          </div>
                        </div>

                        {/* Delete Action */}
                        <div className="run-actions">
                          {!isDeleting ? (
                            <button
                              className="delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(run._id);
                              }}
                            >
                              <Trash2 size={14} />
                              Delete Run
                            </button>
                          ) : (
                            <div className="delete-confirm">
                              <span>Are you sure?</span>
                              <button
                                className="confirm-yes"
                                disabled={deleting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(run._id);
                                }}
                              >
                                {deleting ? "Deleting..." : "Yes, delete"}
                              </button>
                              <button
                                className="confirm-no"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default RunHistory;
