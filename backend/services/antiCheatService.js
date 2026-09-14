/**
 * Anti-Cheat & GPS Spoofing Detection Engine
 * 
 * Verifies run integrity, kinematic feasibility, and detects unrealistic speeds,
 * teleportation leaps, or GPS spoofing attacks.
 */

// Constants & Physical Limits for Human Running
const MAX_HUMAN_SUSTAINED_SPEED_KMH = 45; // Usain Bolt peak sprint record is ~44.7 km/h
const MAX_INSTANTANEOUS_VELOCITY_KMH = 65; // Tolerance for brief GPS drift/burst
const MAX_SINGLE_JUMP_METERS = 300; // Jump distance in single update (typically < 3-5 seconds)
const MIN_PACE_MIN_PER_KM = 1.33; // ~1:20 min/km

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
 * Analyzes run telemetry and determines if spoofing or vehicle usage occurred.
 * 
 * @param {Object} run - Run document
 * @param {Number} duration - Duration in seconds
 * @returns {Object} { isFlagged, reasons, flags, maxSpeedKmh, avgSpeedKmh }
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

    // 1. Check Average Speed
    if (avgSpeedKmh > MAX_HUMAN_SUSTAINED_SPEED_KMH) {
        flags.push("IMPOSSIBLE_AVERAGE_SPEED");
        reasons.push(
            `Average speed of ${avgSpeedKmh.toFixed(1)} km/h exceeds maximum human running limits (45 km/h).`
        );
    }

    // 2. Point-to-Point Segment Velocity & Teleportation Detection
    const path = run.path || [];
    if (path.length >= 2) {
        // Average time per point segment estimate
        const avgSegmentTimeSec = Math.max(1, effectiveDuration / (path.length - 1));

        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];

            const segmentDistKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
            const segmentDistMeters = segmentDistKm * 1000;
            const segmentSpeedKmh = (segmentDistKm / (avgSegmentTimeSec / 3600));

            if (segmentSpeedKmh > maxSpeedKmh) {
                maxSpeedKmh = segmentSpeedKmh;
            }

            // Check for instantaneous teleportation (> 300m in brief window, or any jump > 500m)
            if (segmentDistMeters > MAX_SINGLE_JUMP_METERS && (avgSegmentTimeSec < 30 || segmentDistMeters > 500)) {
                if (!flags.includes("TELEPORTATION_DETECTED")) {
                    flags.push("TELEPORTATION_DETECTED");
                    reasons.push(
                        `Sudden teleportation leap of ${(segmentDistMeters).toFixed(0)}m detected in trajectory.`
                    );
                }
            }

            // Check for extreme instantaneous segment speed
            if (segmentSpeedKmh > MAX_INSTANTANEOUS_VELOCITY_KMH) {
                if (!flags.includes("EXCESSIVE_BURST_VELOCITY")) {
                    flags.push("EXCESSIVE_BURST_VELOCITY");
                    reasons.push(
                        `Instantaneous segment velocity reached ${segmentSpeedKmh.toFixed(1)} km/h.`
                    );
                }
            }
        }
    }

    const isFlagged = flags.length > 0;

    return {
        isValid: !isFlagged,
        isFlagged,
        reasons,
        flags,
        avgSpeedKmh: parseFloat(avgSpeedKmh.toFixed(2)),
        maxSpeedKmh: parseFloat(maxSpeedKmh.toFixed(2)),
    };
};

module.exports = {
    validateRunIntegrity,
    haversineKm,
    MAX_HUMAN_SUSTAINED_SPEED_KMH,
    MAX_INSTANTANEOUS_VELOCITY_KMH,
    MAX_SINGLE_JUMP_METERS,
};
