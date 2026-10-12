/**
 * Anti-Cheat & GPS Spoofing Detection Engine (Steel-Solid Edition)
 * 
 * Multi-layer defense against:
 * 1. Physical limits & vehicles (Speed > 45 km/h)
 * 2. Instant teleportation & macro coordinate leaps
 * 3. Realistic-speed couch spoofing (6-7 km/h) via accelerometer & pedometer sensor fusion
 * 4. Robotic mock applications & constant-speed synthetic trajectory generators
 */

// Realistic Physical Limits for Human Running & Walking
// Elite marathon pace is ~21.1 km/h (2:50 min/km). 
// Any sustained speed over 21.6 km/h (2:46 min/km) over 250m+ is bike / vehicular assistance.
const MAX_HUMAN_SUSTAINED_SPEED_KMH = 21.6; // Max sustained running speed for >= 250m
const MAX_SPRINT_BURST_SPEED_KMH = 28.0; // Short burst sprint ceiling (< 250m)
const MAX_INSTANTANEOUS_VELOCITY_KMH = 32.0; // Tolerance for brief GPS segment burst (> 25m)
const MAX_TELEPORTATION_SPEED_KMH = 35.0; // Speed threshold across any distance jump
const MAX_STRIDE_LENGTH_METERS = 2.4; // Max human running stride length (sprinters top out at 2.0-2.2m)
const MIN_STEPS_PER_KM = 350; // Minimum human walking/jogging steps per km

/**
 * Haversine formula for distance in kilometers
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Computes standard deviation of a numeric array
 */
const computeStandardDeviation = (values) => {
    if (!values || values.length <= 1) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
};

/**
 * Formats speed to pace string (min:sec)
 */
const formatPaceFromSpeed = (speedKmh) => {
    if (!speedKmh || speedKmh <= 0) return "--:--";
    const paceMin = 60 / speedKmh;
    const m = Math.floor(paceMin);
    const s = Math.round((paceMin - m) * 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Analyzes run telemetry, hardware sensors, and kinematics to detect spoofing, bikes, or vehicles.
 * 
 * @param {Object} run - Run document with path and optional sensorTelemetry
 * @param {Number} duration - Duration in seconds
 * @returns {Object} { isValid, isFlagged, reasons, flags, maxSpeedKmh, avgSpeedKmh, sensorIntegrityScore }
 */
const validateRunIntegrity = (run, duration) => {
    const reasons = [];
    const flags = [];
    let maxSpeedKmh = 0;

    const distanceKm = run.distance || 0;
    const effectiveDuration = duration || run.duration || 1;
    const avgSpeedKmh = distanceKm > 0 && effectiveDuration > 0
        ? (distanceKm / (effectiveDuration / 3600))
        : 0;
    const paceString = formatPaceFromSpeed(avgSpeedKmh);

    // ─────────────────────────────────────────────────────────────
    // Layer 1: Physical Human Speed Limits & Vehicle Velocity
    // ─────────────────────────────────────────────────────────────
    if (distanceKm >= 0.25) {
        if (avgSpeedKmh > MAX_HUMAN_SUSTAINED_SPEED_KMH) {
            flags.push("VEHICLE_SPEED_DETECTED");
            reasons.push(
                `Vehicle velocity detected: Average speed of ${avgSpeedKmh.toFixed(1)} km/h (${paceString} min/km) over ${distanceKm.toFixed(2)} km exceeds human running limits (21.6 km/h). Astra runs must be completed on foot.`
            );
        }
    } else {
        if (avgSpeedKmh > MAX_SPRINT_BURST_SPEED_KMH) {
            flags.push("IMPOSSIBLE_SPRINT_SPEED");
            reasons.push(
                `Sprint velocity of ${avgSpeedKmh.toFixed(1)} km/h exceeds human capability limits (${MAX_SPRINT_BURST_SPEED_KMH} km/h).`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Layer 2: Point-to-Point Kinematic Analysis
    // ─────────────────────────────────────────────────────────────
    const path = run.path || [];
    const movingSegmentSpeeds = [];
    let highSpeedSegmentCount = 0;
    let highSpeedDistanceMeters = 0;
    const isOverallHumanPace = avgSpeedKmh <= 20.0; // 3:00 min/km or slower (honest running)

    if (path.length >= 2) {
        const fallbackSegmentTimeSec = Math.max(1, effectiveDuration / (path.length - 1));

        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];

            const segmentDistKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
            const segmentDistMeters = segmentDistKm * 1000;

            let segmentTimeSec = fallbackSegmentTimeSec;
            if (prev.timestamp && curr.timestamp) {
                const prevMs = new Date(prev.timestamp).getTime();
                const currMs = new Date(curr.timestamp).getTime();
                if (currMs > prevMs) {
                    segmentTimeSec = (currMs - prevMs) / 1000;
                }
            }

            const segmentSpeedKmh = segmentTimeSec > 0 
                ? (segmentDistKm / (segmentTimeSec / 3600)) 
                : 0;

            if (segmentDistMeters >= 15 && segmentTimeSec >= 1) {
                if (segmentSpeedKmh > maxSpeedKmh) {
                    maxSpeedKmh = Math.min(segmentSpeedKmh, 999.9);
                }
                if (segmentSpeedKmh >= 1.5) {
                    movingSegmentSpeeds.push(segmentSpeedKmh);
                }
                // Only count in vehicle segments if overall run wasn't a normal human jog/run
                if (segmentSpeedKmh > MAX_HUMAN_SUSTAINED_SPEED_KMH && (!isOverallHumanPace || segmentDistMeters > 50)) {
                    highSpeedSegmentCount++;
                    highSpeedDistanceMeters += segmentDistMeters;
                }
            }

            // Screen-off gap vs Live stream analysis:
            // When a runner keeps phone in pocket with screen off, GPS updates pause.
            // Upon waking screen, coordinates leap. If overall average pace is human (<= 20 km/h),
            // this is provably a screen-wake catchup, NOT cheating.
            if (segmentTimeSec >= 10) {
                if (segmentSpeedKmh > MAX_TELEPORTATION_SPEED_KMH && segmentDistMeters > 500) {
                    if (!isOverallHumanPace || segmentDistMeters > 3000) {
                        if (!flags.includes("TELEPORTATION_DETECTED")) {
                            flags.push("TELEPORTATION_DETECTED");
                            reasons.push(
                                `Teleportation leap: ${segmentDistMeters.toFixed(0)}m covered in ${segmentTimeSec.toFixed(0)}s (${segmentSpeedKmh.toFixed(1)} km/h).`
                            );
                        }
                    }
                }
            } else {
                // Short interval burst (< 10s):
                // If overall pace is legitimate human running (<= 20 km/h), single-point GPS jumps
                // are standard smartphone screen-wake GPS catchups or satellite drift and must NOT flag honest runs.
                if (segmentDistMeters >= 35 && segmentSpeedKmh > MAX_INSTANTANEOUS_VELOCITY_KMH) {
                    if (!isOverallHumanPace || segmentDistMeters > 3000) {
                        if (!flags.includes("EXCESSIVE_BURST_VELOCITY")) {
                            flags.push("EXCESSIVE_BURST_VELOCITY");
                            reasons.push(
                                `Instantaneous segment velocity reached ${segmentSpeedKmh.toFixed(1)} km/h across ${segmentDistMeters.toFixed(0)}m.`
                            );
                        }
                    }
                }
            }
        }

        // Multiple consecutive vehicle-speed segments (only flag if overall pace is also vehicle speed)
        if (!isOverallHumanPace && highSpeedSegmentCount >= 4 && highSpeedDistanceMeters >= 150 && !flags.includes("VEHICLE_SPEED_DETECTED")) {
            flags.push("SUSTAINED_VEHICLE_VELOCITY");
            reasons.push(
                `Sustained vehicular movement: ${highSpeedDistanceMeters.toFixed(0)}m travelled across ${highSpeedSegmentCount} intervals at speeds > ${MAX_HUMAN_SUSTAINED_SPEED_KMH} km/h.`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Layer 3: Sensor Fusion & Biomechanical Movement (Pedometer & Stride)
    // ─────────────────────────────────────────────────────────────
    const sensors = run.sensorTelemetry || {};
    let sensorIntegrityScore = 100;

    if (sensors.isMockFlagged) {
        flags.push("MOCK_PROVIDER_DETECTED");
        reasons.push("Device operating system reported active mock location provider.");
        sensorIntegrityScore = 0;
    }

    if (sensors.isVehicleFlagged) {
        if (!flags.includes("VEHICLE_SPEED_DETECTED") && !flags.includes("LIVE_VEHICLE_DETECTION")) {
            flags.push("LIVE_VEHICLE_DETECTION");
            reasons.push("Real-time live telemetry flagged persistent vehicular velocity during the run.");
            sensorIntegrityScore = Math.min(sensorIntegrityScore, 10);
        }
    }

    // Biomechanical Stride Length Verification (Generous tolerance for pockets/armbands)
    if (distanceKm >= 0.15) {
        const totalSteps = Number(sensors.totalSteps || 0);
        const distanceMeters = distanceKm * 1000;
        const isMobile = sensors.isMobile !== undefined ? sensors.isMobile : true;

        if (totalSteps > 0) {
            const calculatedStrideLength = distanceMeters / totalSteps;
            // Only flag if moving at vehicular speeds (> 15 km/h) AND stride length is physically impossible (> 3.0m)
            if (avgSpeedKmh > 15.0 && calculatedStrideLength > 3.0) {
                flags.push("IMPOSSIBLE_STRIDE_LENGTH");
                reasons.push(
                    `Biomechanical anomaly: Calculated stride length of ${calculatedStrideLength.toFixed(1)}m per footstep (${totalSteps} steps over ${distanceMeters.toFixed(0)}m) at ${avgSpeedKmh.toFixed(1)} km/h matches bicycle or vehicular transport, not running.`
                );
                sensorIntegrityScore = Math.min(sensorIntegrityScore, 15);
            }
        }

        // Couch Spoofer Signature (Zero steps while moving):
        if (isMobile && sensors.hasSensorData) {
            const motionScore = Number(sensors.motionScore || 0);
            const minExpectedSteps = Math.round(distanceKm * 250);

            if (totalSteps < Math.max(25, minExpectedSteps * 0.3) && motionScore < 0.22) {
                flags.push("NO_PHYSICAL_MOVEMENT_DETECTED");
                reasons.push(
                    `Couch spoofing detected: Logged ${distanceKm.toFixed(2)} km with only ${totalSteps} physical footsteps and stationary phone motion score (${motionScore.toFixed(2)}).`
                );
                sensorIntegrityScore = 0;
            } else if (motionScore < 0.10) {
                flags.push("STATIONARY_DEVICE_SPOOF");
                reasons.push(
                    `Device was motionless (motion energy ${motionScore.toFixed(3)}) while GPS coordinates were moving at running pace.`
                );
                sensorIntegrityScore = Math.min(sensorIntegrityScore, 10);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Layer 4: Robotic Velocity & Synthetic Trajectory Entropy
    // ─────────────────────────────────────────────────────────────
    if (movingSegmentSpeeds.length >= 4 && distanceKm >= 0.3) {
        const speedVariance = computeStandardDeviation(movingSegmentSpeeds);
        // Synthetic GPX tools (LocaEdit, iAnyGo) interpolate mathematically fixed speeds (σ < 0.05 km/h) at running pace (>= 7 km/h).
        // Honest walkers at 4-5 km/h are protected.
        if (avgSpeedKmh >= 7.0 && speedVariance < 0.05) {
            flags.push("ROBOTIC_SPEED_UNIFORMITY");
            reasons.push(
                `Synthetic GPS trajectory: Mechanically constant velocity with near-zero human pacing variance (σ = ${speedVariance.toFixed(3)} km/h).`
            );
            sensorIntegrityScore = Math.min(sensorIntegrityScore, 20);
        }
    }

    if (maxSpeedKmh === 0 && avgSpeedKmh > 0) {
        maxSpeedKmh = avgSpeedKmh;
    }

    const isFlagged = flags.length > 0;

    return {
        isValid: !isFlagged,
        isFlagged,
        reasons,
        flags,
        avgSpeedKmh: parseFloat(avgSpeedKmh.toFixed(2)),
        maxSpeedKmh: parseFloat(maxSpeedKmh.toFixed(2)),
        sensorIntegrityScore,
    };
};

module.exports = {
    validateRunIntegrity,
    haversineKm,
    computeStandardDeviation,
    MAX_HUMAN_SUSTAINED_SPEED_KMH,
    MAX_SPRINT_BURST_SPEED_KMH,
    MAX_INSTANTANEOUS_VELOCITY_KMH,
    MAX_TELEPORTATION_SPEED_KMH,
    MAX_STRIDE_LENGTH_METERS,
};
