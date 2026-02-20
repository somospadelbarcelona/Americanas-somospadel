/**
 * GeoService.js
 * Manages player geolocation and proximity alerts to headquarters.
 */

class GeoService {
    constructor() {
        this.watchId = null;
        this.lastKnownPos = null;
    }

    /**
     * Start tracking user position with high accuracy
     */
    startTracking() {
        if (!navigator.geolocation) return;

        // 1. HARD LOCKOUT: Survive reloads and restarts.
        if (localStorage.getItem('geo_v3_blocked')) {
            console.log("📡 [GeoService] Location is permanently silenced.");
            return;
        }

        // 2. RUNTIME GUARD
        if (window._geoSearching) return;

        // 3. COOLDOWN: Don't Spam. Max once every 30 mins automatically.
        const last = parseInt(localStorage.getItem('geo_last_try') || '0');
        if (Date.now() - last < 1800000) return;

        console.log("📡 [GeoService] Single location probe...");
        window._geoSearching = true;
        localStorage.setItem('geo_last_try', Date.now().toString());

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                window._geoSearching = false;
                this._handleUpdate(pos);
            },
            (err) => {
                window._geoSearching = false;
                console.warn("Geo error:", err.message);

                // If they say NO once, we mark it in localStorage so we NEVER ask again.
                if (err.code === 1) { // PERMISSION_DENIED
                    localStorage.setItem('geo_v3_blocked', 'true');
                }

                // For any other error, stop tracking to avoid loops.
                this.stopTracking();
            },
            {
                enableHighAccuracy: false, // Much less intrusive
                timeout: 5000,
                maximumAge: Infinity
            }
        );
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    async _handleUpdate(pos) {
        const { latitude, longitude } = pos.coords;
        this.lastKnownPos = { lat: latitude, lng: longitude };

        // 1. Check proximity to headquarters
        const proximity = this.checkHeadquartersProximity(latitude, longitude);

        // 2. Update Firebase if there's an active user
        const user = window.Store ? window.Store.getState('currentUser') : null;
        if (user && user.uid) {
            await window.db.collection('players').doc(user.uid).update({
                last_location: {
                    lat: latitude,
                    lng: longitude,
                    at: new Date().toISOString(),
                    at_hq: proximity.nearHq ? proximity.hqName : false
                }
            }).catch(e => console.warn("Failed to sync location:", e));
        }

        // 3. Dispatch event for UI
        window.dispatchEvent(new CustomEvent('geo_update', {
            detail: {
                lat: latitude,
                lng: longitude,
                proximity
            }
        }));
    }

    checkHeadquartersProximity(lat, lng) {
        const hq = window.AppConstants.LOCATIONS;
        let nearHq = false;
        let hqName = null;
        let minDistance = Infinity;

        for (const [name, coords] of Object.entries(hq)) {
            const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
            if (distance < coords.radius) {
                nearHq = true;
                hqName = name;
            }
            if (distance < minDistance) minDistance = distance;
        }

        return { nearHq, hqName, distance: Math.round(minDistance) };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }
}

window.GeoService = new GeoService();
