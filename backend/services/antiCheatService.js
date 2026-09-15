/**
 * Anti-Cheat & GPS Spoofing Detection Engine
 * 
 * Verifies run integrity, kinematic feasibility, and detects unrealistic speeds,
 * teleportation leaps, or GPS spoofing attacks while safely handling mobile screen-off gaps.
 */

// Physical Limits for Human Running
const MAX_HUMAN_SUSTAINED_SPEED_KMH = 45; // Usain Bolt peak sprint record is ~44.7 km/h
const MAX_INSTANTANEOUS_VELOCITY_KMH = 65; // Tolerance for brief GPS drift/burst
const MAX_TELEPORTATION_SPEED_KMH = 45; // Speed threshold across any distance jump

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
 * @returns {Object} { isValid, isFlagged, reasons, flags, maxSpeedKmh, avgSpeedKmh }
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

    // 1. Check Overall Average Speed
    if (avgSpeedKmh > MAX_HUMAN_SUSTAINED_SPEED_KMH) {
        flags.push("IMPOSSIBLE_AVERAGE_SPEED");
        reasons.push(
            `Average speed of ${avgSpeedKmh.toFixed(1)} km/h exceeds maximum human running limits (45 km/h).`
        );
    }

    // 2. Point-to-Point Kinematic Analysis
    const path = run.path || [];
    if (path.length >= 2) {
        const fallbackSegmentTimeSec = Math.max(1, effectiveDuration / (path.length - 1));

        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];

            const segmentDistKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
            const segmentDistMeters = segmentDistKm * 1000;

            // Determine actual time delta between coordinates if timestamps exist
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

            // Track peak speed (filter out sub-20m micro-jitter GPS noise)
            if (segmentDistMeters >= 20 && segmentTimeSec >= 1) {
                if (segmentSpeedKmh > maxSpeedKmh) {
                    maxSpeedKmh = Math.min(segmentSpeedKmh, 999.9);
                }
            }

            // A. Screen-off / Background gap analysis (delta >= 10 seconds)
            if (segmentTimeSec >= 10) {
                // If the user ran 500m over 3 minutes with screen locked, speed is ~10 km/h (valid!).
                // Only flag teleportation if the speed required to cover this gap exceeds physical limits.
                if (segmentSpeedKmh > MAX_TELEPORTATION_SPEED_KMH && segmentDistMeters > 300) {
                    if (!flags.includes("TELEPORTATION_DETECTED")) {
                        flags.push("TELEPORTATION_DETECTED");
                        reasons.push(
                            `Teleportation leap: ${segmentDistMeters.toFixed(0)}m covered in ${segmentTimeSec.toFixed(0)}s (${segmentSpeedKmh.toFixed(1)} km/h).`
                        );
                    }
                }
            } 
            // B. High-frequency live stream (delta < 10 seconds)
            else {
                // Ignore micro GPS flutter (< 30m)
                if (segmentDistMeters >= 30) {
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
        }
    }

    // Set maxSpeed fallback to avgSpeed if no significant points recorded
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
    };
};

module.exports = {
    validateRunIntegrity,
    haversineKm,
    MAX_HUMAN_SUSTAINED_SPEED_KMH,
    MAX_INSTANTANEOUS_VELOCITY_KMH,
    MAX_TELEPORTATION_SPEED_KMH,
};
