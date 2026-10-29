/**
 * LiveKinematicsEngine - Real-Time In-Run GPS Telemetry & Anti-Cheat Engine
 * 
 * Decoupled, stateful engine responsible for:
 * 1. Satellite Jitter & Multipath Noise Rejection (underpass & high-rise immunity)
 * 2. State-Aware Coordinate Anchoring (immune to Start/Pause/Screen-wake leaps)
 * 3. Multi-Sample Sustained Velocity Verification (eliminates passing-vehicle false alarms)
 * 4. Biomechanical Sensor Fusion Cross-Validation (running cadence vs vehicular velocity)
 * 5. Deadband filtering and accurate pace calculation
 */

export const KINEMATICS_CONFIG = {
  // Speed thresholds
  MAX_HUMAN_SUSTAINED_SPEED_KMH: 21.6, // 2:46 min/km (World-class running ceiling)
  RECOVERY_SPEED_THRESHOLD_KMH: 18.5,  // Speed below which violation decay occurs
  MAX_TELEPORTATION_SPEED_MPS: 20.0,   // Instantaneous leap ceiling (72 km/h)

  // Violation thresholds (eliminates single-point transient false positives)
  CONSECUTIVE_VIOLATIONS_FOR_WARNING: 3, // Requires 3 consecutive updates (>= 3-4s)
  CONSECUTIVE_VIOLATIONS_FOR_FLAG: 4,    // Requires 4 consecutive updates for backend disqualification
  MIN_SUSTAINED_DISTANCE_METERS: 35.0,   // Must travel at least 35m at vehicular speed

  // Noise & accuracy gates
  MAX_ACCEPTABLE_ACCURACY_METERS: 35.0,  // Discard raw GPS points with accuracy worse than 35m
  RELIABLE_ACCURACY_THRESHOLD_METERS: 18.0, // Suppress vehicle warnings if accuracy is degraded (> 18m)
  MIN_DEADBAND_DISTANCE_METERS: 4.5,     // Ignore micro-jitter under 4.5m when stationary

  // Grace and throttle durations
  CALIBRATION_GRACE_PERIOD_MS: 6000,     // 6s grace window upon Start, Resume, or Screen Wake
  VOICE_THROTTLE_MS: 12000,              // Max 1 voice announcement per 12 seconds
  WARNING_AUTO_CLEAR_MS: 4000,           // Auto-clear visual warning banner 4s after returning to human pace

  // Biomechanical cadence threshold
  MIN_RUNNING_CADENCE_SPM: 130,          // Running cadence (steps/min) that suppresses multipath spikes
};

export class LiveKinematicsEngine {
  constructor(options = {}) {
    this.config = { ...KINEMATICS_CONFIG, ...options };

    // Position & timing baseline
    this.lastCoords = null;
    this.lastMoveTime = 0;
    this.isFirstPoint = true;
    this.gracePeriodUntil = 0;

    // Vehicle detection telemetry
    this.consecutiveViolations = 0;
    this.lifetimeViolations = 0;
    this.highSpeedDistanceMeters = 0;
    this.isVehicleFlagged = false;
    this.lastVoiceAnnouncementTime = 0;

    // Rolling window buffer (last 5 valid points for smoothed velocity)
    this.recentPoints = [];
  }

  /**
   * Initializes or re-initializes engine for a new run session.
   */
  start(initialCoords = null) {
    this.lastCoords = initialCoords ? { ...initialCoords } : null;
    this.lastMoveTime = Date.now();
    this.isFirstPoint = true;
    this.gracePeriodUntil = Date.now() + this.config.CALIBRATION_GRACE_PERIOD_MS;
    this.consecutiveViolations = 0;
    this.lifetimeViolations = 0;
    this.highSpeedDistanceMeters = 0;
    this.isVehicleFlagged = false;
    this.recentPoints = [];
  }

  /**
   * Pauses the engine tracking.
   */
  pause() {
    this.isFirstPoint = true;
  }

  /**
   * Resumes the engine tracking after pause.
   * Sets grace period and flags next GPS reading as an anchor baseline.
   */
  resume() {
    this.isFirstPoint = true;
    this.gracePeriodUntil = Date.now() + this.config.CALIBRATION_GRACE_PERIOD_MS;
    this.consecutiveViolations = 0;
  }

  /**
   * Extends grace period when phone screen wakes up from sleep.
   */
  notifyScreenWake() {
    this.gracePeriodUntil = Math.max(
      this.gracePeriodUntil,
      Date.now() + this.config.CALIBRATION_GRACE_PERIOD_MS
    );
  }

  /**
   * Haversine formula: Computes great-circle distance in kilometers.
   */
  static calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Computes geographic bearing between two points in degrees (0-360).
   */
  static calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  }

  /**
   * Formats pace from seconds and kilometers into "mm:ss" string.
   */
  static formatPace(timeSec, distKm) {
    if (!timeSec || !distKm || distKm <= 0 || timeSec <= 0) return '--:--';
    const paceMin = (timeSec / 60) / distKm;
    let mins = Math.floor(paceMin);
    let secs = Math.round((paceMin - mins) * 60);
    if (secs === 60) {
      mins++;
      secs = 0;
    }
    if (mins > 45 || mins < 1) return '--:--';
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Main GPS coordinate processor.
   * Evaluates incoming fix, filters noise, runs multi-layer anti-cheat,
   * and returns kinematic telemetry update.
   * 
   * @param {Object} input
   * @param {number} input.lat - Current latitude
   * @param {number} input.lng - Current longitude
   * @param {number} [input.accuracy=10] - Horizontal accuracy in meters
   * @param {number|null} [input.gpsSpeed=null] - Hardware Doppler speed in m/s
   * @param {number} [input.currentCadence=0] - Recent footstep cadence in SPM
   * @returns {Object} Processing result
   */
  processLocation({
    lat,
    lng,
    accuracy = 10,
    gpsSpeed = null,
    currentCadence = 0,
  }) {
    const now = Date.now();

    // 1. Accuracy sanity check
    if (accuracy > this.config.MAX_ACCEPTABLE_ACCURACY_METERS) {
      return { accepted: false, reason: 'POOR_ACCURACY' };
    }

    // 2. Anchor baseline check (Startup, Resume after Pause, or Cold-Fix)
    if (this.isFirstPoint || !this.lastCoords) {
      this.lastCoords = { lat, lng };
      this.lastMoveTime = now;
      this.isFirstPoint = false;
      this.recentPoints = [{ lat, lng, time: now, accuracy }];
      return {
        accepted: true,
        isAnchor: true,
        distDeltaKm: 0,
        distDeltaMeters: 0,
        instantSpeedKmh: 0,
        warning: null,
      };
    }

    // 3. Compute raw displacement and elapsed time
    const distDeltaKm = LiveKinematicsEngine.calculateDistanceKm(
      this.lastCoords.lat,
      this.lastCoords.lng,
      lat,
      lng
    );
    const distMeters = distDeltaKm * 1000;
    const timeDeltaSec = Math.max(0.2, (now - this.lastMoveTime) / 1000);

    // 4. Noise & Deadband Filtering
    const isWithinGrace = now < this.gracePeriodUntil;
    const isStationaryJitter = distMeters < this.config.MIN_DEADBAND_DISTANCE_METERS;
    const isAccuracyNoise = accuracy && distMeters < accuracy * 0.45 && distMeters < 15;
    const isHardwareStationary =
      gpsSpeed !== null &&
      gpsSpeed !== undefined &&
      gpsSpeed < 0.3 &&
      distMeters < 8.0;
    // True Kinematic Leap & Screen-Off Sleep Distance Recovery:
    // If the phone was asleep in a pocket for a long gap (timeDeltaSec >= 15s), evaluate average velocity over that gap.
    // E.g., running 2.5 km in 15 mins (10 km/h) is legitimate human running and MUST NOT be discarded.
    const gapSpeedKmh = (distMeters / timeDeltaSec) * 3.6;
    let isTeleportGlitch = false;

    if (timeDeltaSec >= 15) {
      // Long gap (phone screen was off / asleep in pocket):
      // Only reject if average speed across the sleep interval exceeds human running limits (> 21.6 km/h)
      // or if distance is absurdly massive (> 10 km in a single wake)
      if (gapSpeedKmh > this.config.MAX_HUMAN_SUSTAINED_SPEED_KMH || distMeters > 10000) {
        isTeleportGlitch = true;
      }
    } else {
      // Short continuous interval (< 15s):
      // Reject instantaneous impossible bursts (> 20 m/s = 72 km/h)
      // Even within calibration grace, any leap > 100m at impossible velocity is an obvious teleport glitch
      const isBurstSpeed = (distMeters / timeDeltaSec) > this.config.MAX_TELEPORTATION_SPEED_MPS;
      if (isBurstSpeed && (distMeters > 100 || (!isWithinGrace && distMeters > 35))) {
        isTeleportGlitch = true;
      }
    }

    if (isStationaryJitter || isAccuracyNoise || isHardwareStationary || isTeleportGlitch) {
      return {
        accepted: false,
        reason: isTeleportGlitch ? 'TELEPORT_GLITCH' : 'NOISE_FILTERED',
      };
    }

    // 5. Speed computation with rolling buffer smoothing
    const rawSpeedMps = distMeters / timeDeltaSec;
    const instantSpeedKmh = rawSpeedMps * 3.6;

    // Maintain 5-point rolling history
    this.recentPoints.push({ lat, lng, time: now, accuracy });
    if (this.recentPoints.length > 5) {
      this.recentPoints.shift();
    }

    let rollingSpeedKmh = instantSpeedKmh;
    if (this.recentPoints.length >= 3) {
      const oldest = this.recentPoints[0];
      const newest = this.recentPoints[this.recentPoints.length - 1];
      const windowDistKm = LiveKinematicsEngine.calculateDistanceKm(
        oldest.lat,
        oldest.lng,
        newest.lat,
        newest.lng
      );
      const windowTimeSec = Math.max(1, (newest.time - oldest.time) / 1000);
      rollingSpeedKmh = (windowDistKm * 1000 / windowTimeSec) * 3.6;
    }

    // 6. Anti-Cheat Vehicle Speed Evaluation
    let warningPayload = null;
    const isHardwareVelocityLegit =
      gpsSpeed !== null && gpsSpeed !== undefined && gpsSpeed < 6.0; // < 21.6 km/h
    const isDegradedSignal = accuracy > this.config.RELIABLE_ACCURACY_THRESHOLD_METERS;
    const hasHumanCadence = currentCadence >= this.config.MIN_RUNNING_CADENCE_SPM;

    // Detect speed violation
    const isSpeedViolating =
      !isWithinGrace &&
      rollingSpeedKmh > this.config.MAX_HUMAN_SUSTAINED_SPEED_KMH &&
      distMeters >= 12.0;

    // Protect against underpass multipath and passing vehicles:
    // If signal is degraded AND hardware Doppler speed is normal human running, OR runner has high cadence
    const isMultipathSuppressed =
      isSpeedViolating &&
      ((isDegradedSignal && isHardwareVelocityLegit) || (hasHumanCadence && rollingSpeedKmh < 32.0));

    if (isSpeedViolating && !isMultipathSuppressed) {
      this.consecutiveViolations += 1;
      this.lifetimeViolations += 1;
      this.highSpeedDistanceMeters += distMeters;

      // Requires sustained confirmation across multiple updates
      if (
        this.consecutiveViolations >= this.config.CONSECUTIVE_VIOLATIONS_FOR_WARNING &&
        this.highSpeedDistanceMeters >= this.config.MIN_SUSTAINED_DISTANCE_METERS
      ) {
        // Flag for backend if sustained even longer
        if (this.consecutiveViolations >= this.config.CONSECUTIVE_VIOLATIONS_FOR_FLAG) {
          this.isVehicleFlagged = true;
        }

        const shouldSpeak =
          now - this.lastVoiceAnnouncementTime > this.config.VOICE_THROTTLE_MS;
        if (shouldSpeak) {
          this.lastVoiceAnnouncementTime = now;
        }

        warningPayload = {
          active: true,
          speedKmh: rollingSpeedKmh,
          violations: this.consecutiveViolations,
          shouldSpeak,
        };
      }
    } else if (rollingSpeedKmh <= this.config.RECOVERY_SPEED_THRESHOLD_KMH) {
      // Runner is at normal human pace: decay violations
      if (this.consecutiveViolations > 0) {
        this.consecutiveViolations = Math.max(0, this.consecutiveViolations - 1);
      }
      if (this.consecutiveViolations === 0) {
        this.highSpeedDistanceMeters = 0;
        warningPayload = { active: false };
      }
    }

    // 7. Calculate bearing
    const bearing = LiveKinematicsEngine.calculateBearing(
      this.lastCoords.lat,
      this.lastCoords.lng,
      lat,
      lng
    );

    // 8. Commit point as accepted movement
    this.lastCoords = { lat, lng };
    this.lastMoveTime = now;

    return {
      accepted: true,
      isAnchor: false,
      distDeltaKm,
      distDeltaMeters: distMeters,
      instantSpeedKmh,
      rollingSpeedKmh,
      bearing,
      timeDeltaSec,
      warning: warningPayload,
      isVehicleFlagged: this.isVehicleFlagged,
      lifetimeViolations: this.lifetimeViolations,
    };
  }
}
