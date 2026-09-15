/**
 * Anti-Cheat & GPS Spoofing Detection Engine (Steel-Solid Edition)
 * 
 * Multi-layer defense against:
 * 1. Physical limits & vehicles (Speed > 45 km/h)
 * 2. Instant teleportation & macro coordinate leaps
 * 3. Realistic-speed couch spoofing (6-7 km/h) via accelerometer & pedometer sensor fusion
 * 4. Robotic mock applications & constant-speed synthetic trajectory generators
 */

// Physical Limits for Human Running
const MAX_HUMAN_SUSTAINED_SPEED_KMH = 45; // Usain Bolt sprint peak is ~44.7 km/h
const MAX_INSTANTANEOUS_VELOCITY_KMH = 65; // Tolerance for brief GPS drift/burst
const MAX_TELEPORTATION_SPEED_KMH = 45; // Speed threshold across any distance jump
const MIN_STEPS_PER_KM = 350; // Absolute minimum human walking/jogging steps per km

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
 * Analyzes run telemetry, hardware sensors, and kinematics to detect spoofing or cheating.
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

    // ─────────────────────────────────────────────────────────────
    // Layer 1: Physical Human Speed Limits
    // ─────────────────────────────────────────────────────────────
    if (avgSpeedKmh > MAX_HUMAN_SUSTAINED_SPEED_KMH) {
        flags.push("IMPOSSIBLE_AVERAGE_SPEED");
        reasons.push(
            `Average speed of ${avgSpeedKmh.toFixed(1)} km/h exceeds maximum human running limits (45 km/h).`
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Layer 2: Point-to-Point Kinematic Analysis
    // ─────────────────────────────────────────────────────────────
    const path = run.path || [];
    const movingSegmentSpeeds = [];

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

            if (segmentDistMeters >= 20 && segmentTimeSec >= 1) {
                if (segmentSpeedKmh > maxSpeedKmh) {
                    maxSpeedKmh = Math.min(segmentSpeedKmh, 999.9);
                }
                if (segmentSpeedKmh >= 1.5) {
                    movingSegmentSpeeds.push(segmentSpeedKmh);
                }
            }

            // Screen-off gap vs Live stream analysis
            if (segmentTimeSec >= 10) {
                if (segmentSpeedKmh > MAX_TELEPORTATION_SPEED_KMH && segmentDistMeters > 300) {
                    if (!flags.includes("TELEPORTATION_DETECTED")) {
                        flags.push("TELEPORTATION_DETECTED");
                        reasons.push(
                            `Teleportation leap: ${segmentDistMeters.toFixed(0)}m covered in ${segmentTimeSec.toFixed(0)}s (${segmentSpeedKmh.toFixed(1)} km/h).`
                        );
                    }
                }
            } else {
                if (segmentDistMeters >= 30 && segmentSpeedKmh > MAX_INSTANTANEOUS_VELOCITY_KMH) {
                    if (!flags.includes("EXCESSIVE_BURST_VELOCITY")) {
                        flags.push("EXCESSIVE_BURST_VELOCITY");
                        reasons.push(
                            `Instantaneous segment velocity reached ${segmentSpeedKmh.toFixed(1)} km/h.`
                        );
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Layer 3: Sensor Fusion & Biomechanical Movement (Pedometer/Motion)
    // Catches 6-7 km/h spoofers sitting on couch with phone stationary
    // ─────────────────────────────────────────────────────────────
    const sensors = run.sensorTelemetry || {};
    let sensorIntegrityScore = 100;

    if (sensors.isMockFlagged) {
        flags.push("MOCK_PROVIDER_DETECTED");
        reasons.push("Device operating system reported active mock location provider.");
        sensorIntegrityScore = 0;
    }

    // Couch Spoofer Signature:
    // If user covered >= 200m on a mobile device, human biomechanics require foot strikes & dynamic acceleration.
    if (distanceKm >= 0.2) {
        const totalSteps = Number(sensors.totalSteps || 0);
        const motionScore = Number(sensors.motionScore || 0);
        const minExpectedSteps = Math.round(distanceKm * 250); // Minimum 125 steps for 500m

        const isMobile = sensors.isMobile !== undefined ? sensors.isMobile : true;

        if (isMobile) {
            // A. Zero steps / Zero motion while moving 200m+
            if (totalSteps < Math.max(25, minExpectedSteps * 0.3) && motionScore < 0.22) {
                flags.push("NO_PHYSICAL_MOVEMENT_DETECTED");
                reasons.push(
                    `Couch spoofing detected: Logged ${distanceKm.toFixed(2)} km with only ${totalSteps} physical footsteps and stationary phone motion score (${motionScore.toFixed(2)}).`
                );
                sensorIntegrityScore = 0;
            } else if (sensors.hasSensorData && motionScore < 0.10) {
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
    // Catches automated/scripted spoofers (LocaEdit, iAnyGo, FakeGPS) generating uniform routes
    // ─────────────────────────────────────────────────────────────
    if (movingSegmentSpeeds.length >= 3 && distanceKm >= 0.2) {
        const speedVariance = computeStandardDeviation(movingSegmentSpeeds);
        // Human runners naturally fluctuate (stdDev > 0.35 km/h); spoofers interpolate with < 0.12 km/h stdDev
        if (speedVariance < 0.12) {
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
    MAX_INSTANTANEOUS_VELOCITY_KMH,
    MAX_TELEPORTATION_SPEED_KMH,
};
