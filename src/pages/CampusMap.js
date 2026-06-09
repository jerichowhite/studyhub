import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack asset hashing
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadowUrl, iconRetinaUrl: iconUrl });

// Benson Idahosa University, Benin City – fallback only
const BIU_CENTER = [6.4013, 5.627];
const DEFAULT_ZOOM = 17;

// ── MapTiler style catalogue ──────────────────────────────────────────────────
const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

const mapTilerStyles = {
  'basic-v2':    { name: 'Clean',               description: 'Minimal style, fewer labels',         preview: '✨' },
  'backdrop':    { name: 'Backdrop',            description: 'Subtle background, very clean',        preview: '🎨' },
  'streets-v2':  { name: 'Streets (3D)',         description: 'Modern street map with 3D buildings', preview: '🏙️' },
  'outdoor-v2':  { name: 'Outdoor',             description: 'Topographic outdoor style',            preview: '🏔️' },
  'satellite':   { name: 'Satellite',           description: 'Real satellite imagery',               preview: '🛰️' },
  'hybrid':      { name: 'Satellite + Labels',  description: 'Satellite with street labels',         preview: '🗺️' },
  'topo-v2':     { name: 'Topographic',         description: 'Detailed topographic map',             preview: '🗻' },
  'bright-v2':   { name: 'Bright',              description: 'High contrast bright colors',          preview: '☀️' },
  'dataviz':     { name: 'Data Viz',            description: 'Optimised for data visualisation',     preview: '📊' },
};

// ── Helper: build a circular avatar div-icon ─────────────────────────────────
const buildUserIcon = (photoURL, isMe) => {
  const borderColor = isMe ? '#3B82F6' : '#EF4444';
  return L.divIcon({
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          width:40px;height:40px;border-radius:50%;
          border:3px solid ${borderColor};overflow:hidden;
          background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);
        ">
          <img
            src="${photoURL || '/default-avatar.png'}"
            style="width:100%;height:100%;object-fit:cover;"
            onerror="this.src='/default-avatar.png'"
          />
        </div>
        <div style="
          position:absolute;top:-2px;right:-2px;
          width:12px;height:12px;
          background:#10B981;border:2px solid #fff;border-radius:50%;
        "></div>
        ${isMe ? `
          <div style="
            position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
            background:${borderColor};color:#fff;
            padding:2px 8px;border-radius:4px;
            font-size:10px;font-weight:bold;white-space:nowrap;
          ">You</div>
        ` : ''}
      </div>`,
    className: 'campus-map-marker',
    iconSize: [40, isMe ? 60 : 40],
    iconAnchor: [20, isMe ? 60 : 40],
  });
};

// ── UserProfileCard – shown inside a Popup ───────────────────────────────────
const UserProfileCard = ({ user }) => {
  const [fullProfile, setFullProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDoc(doc(db, 'users', user.id)).then((snap) => {
      if (snap.exists()) setFullProfile(snap.data());
    });
  }, [user.id]);

  if (!fullProfile) {
    return (
      <div className="p-4 flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="p-2 w-64">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={user.photoURL || '/default-avatar.png'}
          alt={user.displayName}
          className="w-14 h-14 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{user.displayName}</h3>
          <p className="text-xs text-gray-600 truncate">
            {user.department} • {user.level} Level
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-green-600">Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Points', val: fullProfile.points || 0 },
          { label: 'Streak', val: fullProfile.stats?.loginStreak || 0 },
          { label: 'Files',  val: fullProfile.stats?.materialsUploaded || 0 },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-50 rounded p-2 text-center">
            <p className="text-sm font-bold">{val}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {fullProfile.badges?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Badges</p>
          <div className="flex gap-1">
            {fullProfile.badges.slice(0, 3).map((_, idx) => (
              <div key={idx} className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs">
                🏆
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/peer-chat?user=${user.id}`)}
          className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700"
        >
          💬 Message
        </button>
        <button
          onClick={() => navigate(`/profile/${user.id}`)}
          className="flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-200"
        >
          👤 Profile
        </button>
      </div>
    </div>
  );
};

// ── Main CampusMap component ──────────────────────────────────────────────────
const CampusMap = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [showMyLocation, setShowMyLocation] = useState(true);
  const [filters, setFilters] = useState({ department: 'all', level: 'all' });
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedMapStyle, setSelectedMapStyle] = useState(() => {
    const saved = localStorage.getItem('preferredMapStyle');
    return saved && mapTilerStyles[saved] ? saved : 'basic-v2';
  });

  // ── Warn if API key is missing ────────────────────────────────────────────
  useEffect(() => {
    if (!MAPTILER_KEY) {
      console.error('MapTiler API key not found! Add REACT_APP_MAPTILER_KEY to your .env file');
    }
  }, []);

  // ── Persist preferred map style ───────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('preferredMapStyle', selectedMapStyle);
  }, [selectedMapStyle]);

  // ── Get initial location and set map center ───────────────────────────────
  // Runs once on mount regardless of showMyLocation, so the map always
  // opens centered on the user.
  useEffect(() => {
    if (!currentUser) return;

    if (!('geolocation' in navigator)) {
      setMapCenter(BIU_CENTER);
      setMapReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setMyLocation(loc);
        setMapCenter([loc.latitude, loc.longitude]);
        setMapReady(true);
      },
      () => {
        // Permission denied or timed out – fall back to campus centre
        setMapCenter(BIU_CENTER);
        setMapReady(true);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist location to Firestore ─────────────────────────────────────────
  const updateUserLocation = async (location) => {
    if (!currentUser || !userProfile) return;
    try {
      await setDoc(
        doc(db, 'userLocations', currentUser.uid),
        {
          userId: currentUser.uid,
          displayName: userProfile.displayName || currentUser.displayName,
          photoURL: userProfile.photoURL || currentUser.photoURL,
          department: userProfile.department || '',
          level: userProfile.level || '',
          location: { latitude: location.latitude, longitude: location.longitude },
          lastUpdated: serverTimestamp(),
          visible: showMyLocation,
          online: true,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  // ── Watch position and broadcast to Firestore ─────────────────────────────
  useEffect(() => {
    if (!showMyLocation || !currentUser) return;
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setMyLocation(loc);
        updateUserLocation(loc);
      },
      null,
      { enableHighAccuracy: false, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMyLocation, currentUser, userProfile]);

  // ── Mark invisible when toggle is off ────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setDoc(
      doc(db, 'userLocations', currentUser.uid),
      { visible: showMyLocation, online: showMyLocation },
      { merge: true }
    ).catch(() => {});
  }, [showMyLocation, currentUser]);

  // ── Real-time listener for other users ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'userLocations'),
      where('visible', '==', true),
      where('online', '==', true)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          if (d.id === currentUser.uid) return;
          const data = d.data();
          if (filters.department !== 'all' && data.department !== filters.department) return;
          if (filters.level !== 'all' && String(data.level) !== filters.level) return;
          list.push({ id: d.id, ...data });
        });
        setUsers(list);
      },
      (error) => {
        console.error('userLocations listener error:', error);
      }
    );

    return () => unsub();
  }, [currentUser, filters]);

  // ── Waiting for GPS ───────────────────────────────────────────────────────
  if (!mapReady || !mapCenter) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Getting your location…</p>
          <p className="text-sm text-gray-500 mt-2">Please allow location access when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0">
      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        preferCanvas={true}
        maxZoom={19}
        minZoom={2}
      >
        <TileLayer
          attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
          url={`https://api.maptiler.com/maps/${selectedMapStyle}/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
          tileSize={512}
          zoomOffset={-1}
          eventHandlers={{
            loading: () => setMapLoading(true),
            load: () => setMapLoading(false),
          }}
        />

        {/* Current user pin */}
        {myLocation && showMyLocation && (
          <Marker
            position={[myLocation.latitude, myLocation.longitude]}
            icon={buildUserIcon(userProfile?.photoURL, true)}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold">You</p>
                <p className="text-sm text-gray-600">
                  {userProfile?.displayName || currentUser?.displayName}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Other students' pins */}
        {users.map((user) => (
          <Marker
            key={user.id}
            position={[user.location.latitude, user.location.longitude]}
            icon={buildUserIcon(user.photoURL, false)}
          >
            <Popup maxWidth={300} minWidth={250}>
              <UserProfileCard user={user} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Back to Dashboard button ─────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl shadow-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
        >
          ← Dashboard
        </button>
      </div>

      {/* ── Tile loading overlay ─────────────────────────────────────────── */}
      {mapLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Loading map…</span>
          </div>
        </div>
      )}

      {/* ── Controls panel ───────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 z-[1000]">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          🗺️ Campus Live Map
          <span className="text-xs font-normal text-gray-500 bg-green-100 px-2 py-0.5 rounded-full">
            MapTiler
          </span>
        </h2>

        {/* Online count */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-700 font-medium">
            {users.length} student{users.length !== 1 ? 's' : ''} online
          </span>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-4">
          {/* Map style selector */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Map Style</label>
            <select
              value={selectedMapStyle}
              onChange={(e) => setSelectedMapStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(mapTilerStyles).map(([key, style]) => (
                <option key={key} value={key}>
                  {style.preview} {style.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {mapTilerStyles[selectedMapStyle].description}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Business">Business</option>
              <option value="Sciences">Sciences</option>
              <option value="Arts">Arts</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              {['100', '200', '300', '400', '500'].map((l) => (
                <option key={l} value={l}>{l} Level</option>
              ))}
            </select>
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="pt-3 border-t border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showMyLocation}
              onChange={(e) => setShowMyLocation(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 block">Show my location</span>
              <span className="text-xs text-gray-500">
                {showMyLocation ? '✅ Visible to other students' : "👻 You're in invisible mode"}
              </span>
            </div>
          </label>

          {/* Recenter button */}
          <button
            onClick={() => {
              if (myLocation && mapRef.current) {
                mapRef.current.setView(
                  [myLocation.latitude, myLocation.longitude],
                  DEFAULT_ZOOM
                );
              }
            }}
            disabled={!myLocation}
            className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            📍 Center on My Location
          </button>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 z-[1000]">
        <p className="text-xs font-bold dark:text-white mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
            <span className="text-xs">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
            <span className="text-xs">Other students</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs">Online now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
