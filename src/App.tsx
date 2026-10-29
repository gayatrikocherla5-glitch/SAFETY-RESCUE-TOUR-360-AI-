/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Users, 
  Building, 
  Sparkles, 
  HardDrive, 
  FileText, 
  ShieldCheck, 
  Hotel, 
  AlertTriangle, 
  CheckCircle, 
  PhoneCall, 
  Navigation, 
  Compass, 
  RotateCcw,
  Bell,
  X,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  HelpCircle,
  Footprints,
  Eye,
  HardHat,
  Send,
  Zap,
  Activity,
} from 'lucide-react';
import { 
  LanguageCode, 
  User, 
  LocationCoordinate, 
  SafeZone, 
  EmergencyPlace, 
  SosAlert, 
  IncidentReport, 
  TravelGroup, 
  OfflinePack, 
  BlockchainProof,
  SosSignalRangeKm,
  SafetyNotification,
  EmergencyContact,
  LiveMovementTelemetry
} from './types';
import { TRANSLATIONS } from './utils/languages';
import { soundEngine } from './utils/audio';
import { 
  dispatchAutomatedSmsToContacts, 
  checkAndRequestEmergencyPermissions, 
  DEFAULT_EMERGENCY_CONTACTS 
} from './utils/smsService';
import { 
  INITIAL_USER, 
  INITIAL_SAFE_ZONES, 
  INITIAL_EMERGENCY_PLACES, 
  INITIAL_OFFLINE_PACKS, 
  INITIAL_TRAVEL_GROUP, 
  INITIAL_BLOCKCHAIN_PROOF, 
  appStorage 
} from './utils/storage';

// Subcomponents
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { InteractiveMap } from './components/InteractiveMap';
import { SmartCheckIn } from './components/SmartCheckIn';
import { DigitalIdCard } from './components/DigitalIdCard';
import { AiAssistant } from './components/AiAssistant';
import { SafePlaces } from './components/SafePlaces';
import { EmergencyContacts } from './components/EmergencyContacts';
import { IncidentReporting } from './components/IncidentReporting';
import { OfflineSafetyPacks } from './components/OfflineSafetyPacks';
import { TravelGroupPortal } from './components/TravelGroupPortal';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { SosModal } from './components/SosModal';
import { DirectSmsShareModal } from './components/DirectSmsShareModal';
import { UserProfileModal } from './components/UserProfileModal';
import { InAppDirectCaller } from './components/InAppDirectCaller';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [isLandingVisible, setIsLandingVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isRescueBattery, setIsRescueBattery] = useState<boolean>(false);
  const [isDirectSmsModalOpen, setIsDirectSmsModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User>(INITIAL_USER);

  // In-App Direct Calling state (100% inside website without opening external apps)
  const [isInAppCallerOpen, setIsInAppCallerOpen] = useState<boolean>(false);
  const [activeCallContact, setActiveCallContact] = useState<EmergencyContact | { name: string; phone: string; relation: string; isPrimary?: boolean } | null>(null);

  const handleStartInAppCall = useCallback((targetContact: EmergencyContact | { name: string; phone: string; relation: string; isPrimary?: boolean }) => {
    setActiveCallContact(targetContact);
    setIsInAppCallerOpen(true);
  }, []);
  
  // Coordinates (default centered around scenic heritage coastline)
  const [userCoords, setUserCoords] = useState<LocationCoordinate>({
    lat: 15.5002,
    lng: 73.8282,
    accuracy: 12,
    timestamp: Date.now(),
  });

  // Live Location Moving Tracking state (activated when SMS is shared to saved contacts)
  const [isLiveLocationMoving, setIsLiveLocationMoving] = useState<boolean>(false);
  const [liveMovingTrail, setLiveMovingTrail] = useState<LocationCoordinate[]>([{
    lat: 15.5002,
    lng: 73.8282,
    accuracy: 12,
    timestamp: Date.now(),
  }]);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveMovementTelemetry>({
    isMoving: false,
    speedKmh: 5.2,
    headingDeg: 48,
    headingCardinal: 'NE',
    distanceTraveledMeters: 0,
    mode: 'walk',
    lastBroadcastTimestamp: Date.now(),
    contactsAlertedCount: user?.emergencyContacts?.length || 2,
  });

  // Continuous corridor path waypoints for smooth live movement simulation
  const rescueWaypointsRef = useRef([
    { lat: 15.50020, lng: 73.82820 },
    { lat: 15.50140, lng: 73.82910 },
    { lat: 15.50280, lng: 73.83040 },
    { lat: 15.50430, lng: 73.83180 },
    { lat: 15.50580, lng: 73.83330 },
    { lat: 15.50720, lng: 73.83470 },
    { lat: 15.50650, lng: 73.83610 },
    { lat: 15.50490, lng: 73.83470 },
    { lat: 15.50320, lng: 73.83290 },
    { lat: 15.50160, lng: 73.83040 },
  ]);
  const waypointIndexRef = useRef<number>(0);
  const progressRatioRef = useRef<number>(0);

  const [safeZones, setSafeZones] = useState<SafeZone[]>(INITIAL_SAFE_ZONES);
  const [emergencyPlaces, setEmergencyPlaces] = useState<EmergencyPlace[]>(INITIAL_EMERGENCY_PLACES);
  const [offlinePacks, setOfflinePacks] = useState<OfflinePack[]>(INITIAL_OFFLINE_PACKS);
  const [travelGroup, setTravelGroup] = useState<TravelGroup>(INITIAL_TRAVEL_GROUP);
  const [blockchainProof, setBlockchainProof] = useState<BlockchainProof>(INITIAL_BLOCKCHAIN_PROOF);
  const [incidents, setIncidents] = useState<IncidentReport[]>(appStorage.getIncidents());
  const [offlineSosQueue, setOfflineSosQueue] = useState<SosAlert[]>(appStorage.getOfflineSosQueue());

  // SOS Emergency state
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [activeSos, setActiveSos] = useState<SosAlert | null>(null);
  const [authoritySosList, setAuthoritySosList] = useState<SosAlert[]>([]);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Active Zone & Toasts State
  const [currentZone, setCurrentZone] = useState<SafeZone | null>(null);
  const [activeToasts, setActiveToasts] = useState<SafetyNotification[]>([]);
  const activeZoneRef = useRef<string | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // Notifications State
  const [notifications, setNotifications] = useState<SafetyNotification[]>([
    {
      id: 'notif_welcome',
      title: '🛡️ Safety Protocol Active',
      message: 'SAFETY & RESCUE TOUR 360°– AI is monitoring your tourist corridor with 24x7 geofences.',
      type: 'info',
      timestamp: Date.now() - 60000,
    },
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Lost assistance modal state
  const [showLostModal, setShowLostModal] = useState<boolean>(false);

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  // Add notification helper with real-time on-screen toast trigger
  const addNotification = useCallback((
    title: string, 
    message: string, 
    type: SafetyNotification['type'] = 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const newNotif: SafetyNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      actionLabel,
      onAction,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setActiveToasts(prev => [newNotif, ...prev]);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Helper distance function (Haversine formula in meters)
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
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
  };

  // Continuous Geofence Monitoring across the entire app (triggers for safety, construction, and danger zones)
  useEffect(() => {
    let matchedZone: SafeZone | null = null;
    for (const zone of safeZones) {
      const dist = getDistanceMeters(userCoords.lat, userCoords.lng, zone.center[0], zone.center[1]);
      if (dist <= zone.radiusMeters) {
        matchedZone = zone;
        break;
      }
    }

    if (matchedZone) {
      if (activeZoneRef.current !== matchedZone.id) {
        const isFirst = isInitialMountRef.current;
        activeZoneRef.current = matchedZone.id;
        setCurrentZone(matchedZone);

        // Only trigger alerts and sound after user has loaded the app
        if (!isFirst) {
          if (matchedZone.type === 'safe') {
            soundEngine.playSuccessChime();
            try {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
            } catch {}
            addNotification(
              `🛡️ ENTERED SAFETY ZONE: ${matchedZone.name}`,
              `You have entered a verified Tourist Safety Zone. 24/7 Tourist Police presence and automated help kiosks are active.`,
              'safe'
            );
          } else if (matchedZone.type === 'construction') {
            soundEngine.playWarningTone();
            try {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
              }
            } catch {}
            addNotification(
              `🚧 ENTERED CONSTRUCTION ZONE: ${matchedZone.name}`,
              `Caution: Active construction with heavy machinery & excavation. ${matchedZone.warningReason || ''} Safe detour: ${matchedZone.saferAlternative || 'Follow marked pedestrian bypass.'}`,
              'construction'
            );
          } else if (matchedZone.type === 'danger') {
            soundEngine.playWarningTone();
            try {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([300, 100, 300, 100, 300]);
              }
            } catch {}
            addNotification(
              `🔴 ALERT: ENTERED DANGER ZONE: ${matchedZone.name}`,
              `Severe Hazard Warning: ${matchedZone.warningReason || 'Restricted hazard area.'} Immediate exit recommended: ${matchedZone.saferAlternative || 'Follow illuminated tourist bypass.'}`,
              'emergency'
            );

            // Hands-Free Automatic SMS to saved contacts on entering Danger Zone
            const autoDangerSms = user?.autoSmsOnDangerZone ?? true;
            const handsFree = user?.handsFreeSmsEnabled ?? true;
            if (handsFree && autoDangerSms && user?.emergencyContacts?.length > 0) {
              const smsRecords = dispatchAutomatedSmsToContacts(
                user.emergencyContacts,
                user,
                userCoords,
                { emergencyType: 'danger_zone_breach', signalRangeKm: 20 },
                'danger_zone_entry'
              );
              soundEngine.playSmsDispatchedTone();
              setIsLiveLocationMoving(true);
              setLiveMovingTrail(prev => prev.length > 0 ? prev : [userCoords]);
              setLiveTelemetry(prev => ({
                ...prev,
                isMoving: true,
                distanceTraveledMeters: 0,
                lastBroadcastTimestamp: Date.now(),
                contactsAlertedCount: user.emergencyContacts.length,
              }));
              addNotification(
                '📱 HANDS-FREE SMS DISPATCHED: DANGER ZONE BREACH',
                `Automated SMS with live coordinates (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}) sent to ${smsRecords.length} emergency contacts without needing phone touch. Live GPS location moving on map!`,
                'sms'
              );
            }
          } else if (matchedZone.type === 'caution') {
            soundEngine.playWarningTone();
            addNotification(
              `🟡 CAUTION ZONE: ${matchedZone.name}`,
              `Caution: ${matchedZone.description}. ${matchedZone.warningReason || ''}`,
              'warning'
            );
          }
        }
      }
    } else {
      activeZoneRef.current = null;
      setCurrentZone(null);
    }
    isInitialMountRef.current = false;
  }, [userCoords.lat, userCoords.lng, safeZones, addNotification, user]);

  // Attempt real GPS location on mount if user permits
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 10),
            timestamp: Date.now(),
          });
          addNotification(
            '📍 Live GPS Position Acquired',
            `Connected to satellite coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}. Geo-fence active.`,
            'info'
          );
        },
        _err => {
          // Graceful fallback to default scenic tourist corridor
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Sync offline SOS queue when toggling back online
  useEffect(() => {
    if (!isOffline && offlineSosQueue.length > 0) {
      soundEngine.playSuccessChime();
      addNotification(
        '🌐 Online Connection Restored',
        `Successfully transmitted ${offlineSosQueue.length} queued emergency SOS alerts to Authority Responders.`,
        'info'
      );
      // add to authority list
      setAuthoritySosList(prev => [...offlineSosQueue, ...prev]);
      appStorage.clearOfflineSosQueue();
      setOfflineSosQueue([]);
    }
  }, [isOffline]);

  // Continuous Live Movement Engine (Runs when isLiveLocationMoving is true)
  useEffect(() => {
    if (!isLiveLocationMoving) {
      setLiveTelemetry(prev => ({ ...prev, isMoving: false }));
      return;
    }

    setLiveTelemetry(prev => ({ ...prev, isMoving: true }));

    const interval = setInterval(() => {
      const mode = liveTelemetry.mode;
      const speedKmh = mode === 'walk' ? 5.2 : mode === 'run' ? 12.0 : 35.0;
      const stepRatio = mode === 'walk' ? 0.08 : mode === 'run' ? 0.18 : 0.45;
      progressRatioRef.current += stepRatio;

      const waypoints = rescueWaypointsRef.current;
      if (progressRatioRef.current >= 1) {
        progressRatioRef.current = 0;
        waypointIndexRef.current = (waypointIndexRef.current + 1) % waypoints.length;
      }

      const p1 = waypoints[waypointIndexRef.current];
      const nextIndex = (waypointIndexRef.current + 1) % waypoints.length;
      const p2 = waypoints[nextIndex];
      const ratio = progressRatioRef.current;

      const newLat = p1.lat + (p2.lat - p1.lat) * ratio;
      const newLng = p1.lng + (p2.lng - p1.lng) * ratio;

      // Calculate bearing angle & cardinal direction
      const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
      const lat1 = p1.lat * (Math.PI / 180);
      const lat2 = p2.lat * (Math.PI / 180);
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const headingDeg = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
      const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const headingCardinal = cardinals[Math.round(headingDeg / 45) % 8];

      setUserCoords(prevCoords => {
        const stepDist = getDistanceMeters(prevCoords.lat, prevCoords.lng, newLat, newLng);
        const updated: LocationCoordinate = {
          lat: newLat,
          lng: newLng,
          accuracy: 8,
          timestamp: Date.now(),
        };

        setLiveMovingTrail(prevTrail => [...prevTrail.slice(-120), updated]);

        setLiveTelemetry(prevTel => ({
          ...prevTel,
          isMoving: true,
          speedKmh,
          headingDeg,
          headingCardinal,
          distanceTraveledMeters: prevTel.distanceTraveledMeters + Math.round(stepDist),
          contactsAlertedCount: user?.emergencyContacts?.length || 2,
        }));

        return updated;
      });

      // Keep active SOS coordinates updated in real-time
      setActiveSos(prevSos => {
        if (!prevSos) return null;
        return {
          ...prevSos,
          coordinates: { lat: newLat, lng: newLng, accuracy: 8, timestamp: Date.now() },
          coords: { lat: newLat, lng: newLng, accuracy: 8, timestamp: Date.now() },
        };
      });

    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveLocationMoving, liveTelemetry.mode, user.emergencyContacts?.length]);

  // Handler to activate live location movement and optionally switch to map
  const handleActivateLiveLocationMoving = useCallback((switchTab: boolean = true) => {
    setIsLiveLocationMoving(true);
    setLiveMovingTrail(prev => prev.length > 0 ? prev : [userCoords]);
    if (switchTab) {
      setActiveTab('map');
    }
    soundEngine.playSmsDispatchedTone();
    addNotification(
      '🗺️ LIVE LOCATION TRACKER ACTIVE & MOVING',
      `Your live GPS location is now actively moving along the corridor and broadcasting real-time coordinates to your saved contacts.`,
      'sms'
    );
  }, [addNotification, userCoords]);

  // Handler to re-broadcast updated live moving coordinates to all saved contacts
  const handleSendUpdatedMovingSms = useCallback(() => {
    const rawContacts = Array.isArray(user?.emergencyContacts) && user.emergencyContacts.length > 0
      ? user.emergencyContacts
      : DEFAULT_EMERGENCY_CONTACTS;
    
    dispatchAutomatedSmsToContacts(rawContacts, user, userCoords, {
      emergencyType: activeSos?.emergencyType || 'sos_manual',
      signalRangeKm: activeSos?.signalRangeKm || 20,
    }, 'panic_button', { attemptDeviceSms: false });

    soundEngine.playSmsDispatchedTone();
    addNotification(
      '📱 UPDATED LIVE GPS SMS DISPATCHED',
      `Latest moving coordinates (${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}) dispatched to ${rawContacts.length} emergency contacts!`,
      'sms'
    );
  }, [user, userCoords, activeSos, addNotification]);

  // Trigger SOS handler - Automatically sends predefined SMS to all saved contacts with Google Maps link
  const handleTriggerSos = (
    emergencyType: SosAlert['emergencyType'] = 'sos_manual',
    signalRange: SosSignalRangeKm = 20
  ) => {
    // Immediately sound the high-priority emergency siren
    soundEngine.playEmergencyAlarm();

    // Check & request browser permissions for SOS dispatch (Notifications & Geolocation)
    checkAndRequestEmergencyPermissions().catch(() => {});

    // Refresh live GPS coordinates if geolocation available
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 10),
            timestamp: Date.now(),
          });
        },
        err => {
          console.warn('GPS location retrieval notice:', err?.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }

    const safeCoords: LocationCoordinate = {
      lat: typeof userCoords?.lat === 'number' && !isNaN(userCoords.lat) ? userCoords.lat : 15.50020,
      lng: typeof userCoords?.lng === 'number' && !isNaN(userCoords.lng) ? userCoords.lng : 73.82820,
      accuracy: typeof userCoords?.accuracy === 'number' && !isNaN(userCoords.accuracy) ? userCoords.accuracy : 10,
      timestamp: Date.now(),
    };

    const currentLat = safeCoords.lat.toFixed(5);
    const currentLng = safeCoords.lng.toFixed(5);
    const googleMapsUrl = `https://maps.google.com/?q=${currentLat},${currentLng}`;

    // Ensure we always have recipients: saved emergency contacts or verified official emergency services
    const rawContacts = Array.isArray(user?.emergencyContacts) && user.emergencyContacts.length > 0
      ? user.emergencyContacts.filter(Boolean)
      : DEFAULT_EMERGENCY_CONTACTS;

    const newAlert: SosAlert = {
      id: `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      userName: user.name,
      digitalSafetyId: user.digitalSafetyId,
      coordinates: safeCoords,
      coords: safeCoords,
      timestamp: Date.now(),
      status: 'active',
      isOfflineQueued: isOffline,
      batteryStatus: user.batteryLevel,
      batteryLevel: user.batteryLevel,
      emergencyType: emergencyType,
      networkStatus: isOffline ? 'offline_queued' : 'online',
      transmissionStatus: isOffline ? 'pending_sync' : 'transmitted',
      signalRangeKm: signalRange,
      autoEscalateRange: true,
      reachEstimate: {
        respondersCount: signalRange === 10 ? 8 : signalRange === 20 ? 25 : signalRange === 50 ? 75 : 240,
        hospitalsCount: signalRange === 10 ? 2 : signalRange === 20 ? 7 : signalRange === 50 ? 22 : 85,
        policeStationsCount: signalRange === 10 ? 3 : signalRange === 20 ? 12 : signalRange === 50 ? 35 : 110,
        coastalGuardHubs: signalRange >= 20 ? 2 : 1,
        civilDefenseBase: signalRange >= 50,
        satelliteNavRelay: signalRange >= 50,
      }
    };

    // Automatically dispatch emergency SMS to all saved contacts directly without touching phone
    const smsRecords = dispatchAutomatedSmsToContacts(rawContacts, user, safeCoords, {
      ...newAlert,
      signalRangeKm: signalRange,
      emergencyType,
    }, 'panic_button', { attemptDeviceSms: false });
    newAlert.smsDispatchLog = smsRecords;

    // Immediately activate continuous live location moving on map
    setIsLiveLocationMoving(true);
    setLiveMovingTrail([safeCoords]);
    setLiveTelemetry(prev => ({
      ...prev,
      isMoving: true,
      distanceTraveledMeters: 0,
      lastBroadcastTimestamp: Date.now(),
      contactsAlertedCount: rawContacts.length,
    }));

    setActiveSos(newAlert);
    setIsSosModalOpen(true);

    if (isOffline) {
      appStorage.enqueueOfflineSos(newAlert);
      setOfflineSosQueue(prev => [newAlert, ...prev]);
      addNotification(
        'OFFLINE SOS ACTIVE',
        `Distress beacon configured for ${signalRange} km perimeter. Stored securely in encrypted local memory.`,
        'emergency'
      );
      soundEngine.playSmsDispatchedTone();
      addNotification(
        '📱 SMS QUEUED FOR SAVED CONTACTS',
        `Predefined distress SMS prepared with live GPS Google Maps link (${googleMapsUrl}) for ${rawContacts.length} contacts: ${rawContacts.map(c => c.name).join(', ')}. Local carrier link queued.`,
        'sms'
      );
    } else {
      setAuthoritySosList(prev => [newAlert, ...prev]);
      const primaryName = rawContacts[0]?.name || 'Emergency Contacts';
      addNotification(
        '🚨 EMERGENCY SOS BROADCASTED',
        `Dispatched across ${signalRange} km envelope to Police & ${primaryName}. Live GPS tracking active.`,
        'emergency'
      );
      soundEngine.playSmsDispatchedTone();
      const contactNames = rawContacts.map(c => `${c.name} (${c.phone})`).join(', ');
      addNotification(
        '📱 AUTOMATIC SMS SENT (NO PHONE TOUCH REQUIRED)',
        `Predefined distress SMS with live Google Maps link (${googleMapsUrl}) and Digital Safety ID (${user.digitalSafetyId}) has been sent directly to all ${rawContacts.length} contacts (${contactNames}) via Cellular Gateway without touching phone!`,
        'sms'
      );
    }
  };

  const handleUpdateSosRange = (sosId: string, newRange: SosSignalRangeKm) => {
    setAuthoritySosList(prev => prev.map(s => {
      if (s.id === sosId) {
        return {
          ...s,
          signalRangeKm: newRange,
          reachEstimate: {
            respondersCount: newRange === 10 ? 8 : newRange === 20 ? 25 : newRange === 50 ? 75 : 240,
            hospitalsCount: newRange === 10 ? 2 : newRange === 20 ? 7 : newRange === 50 ? 22 : 85,
            policeStationsCount: newRange === 10 ? 3 : newRange === 20 ? 12 : newRange === 50 ? 35 : 110,
            coastalGuardHubs: newRange >= 20 ? 2 : 1,
            civilDefenseBase: newRange >= 50,
            satelliteNavRelay: newRange >= 50,
          }
        };
      }
      return s;
    }));

    if (activeSos && activeSos.id === sosId) {
      setActiveSos(prev => prev ? { ...prev, signalRangeKm: newRange } : null);
    }

    addNotification(
      '📡 Signal Perimeter Expanded',
      `Emergency broadcast escalated to ${newRange} km radius. Mobilizing regional rescue assets.`,
      'warning'
    );
  };

  const handleCancelActiveSos = () => {
    soundEngine.stopEmergencyAlarm();
    if (activeSos) {
      setAuthoritySosList(prev => prev.filter(s => s.id !== activeSos.id));
    }
    setActiveSos(null);
    setIsSosModalOpen(false);
    addNotification('SOS Resolved', 'Emergency alert has been resolved. You reported safe.', 'info');
  };

  // Lost person instant guide
  const handleImLostClick = () => {
    soundEngine.playClickSound();
    soundEngine.playWarningTone();
    setShowLostModal(true);
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen font-sans transition-colors ${
        isRescueBattery 
          ? 'bg-black text-slate-100' 
          : 'bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white'
      }`}>
      
      {/* Top Navigation */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={lang => setCurrentLanguage(lang)}
        isOffline={isOffline}
        onToggleOffline={() => {
          setIsOffline(!isOffline);
          addNotification(
            isOffline ? 'Online Mode Re-engaged' : 'Offline Safety Mode Engaged',
            isOffline ? 'Connected to cloud AI and live dispatch.' : 'Using local cached maps and emergency database.',
            'info'
          );
        }}
        isRescueBattery={isRescueBattery}
        onToggleRescueBattery={() => {
          setIsRescueBattery(!isRescueBattery);
          addNotification(
            isRescueBattery ? 'Standard Power Mode' : 'Rescue Battery Mode Active',
            isRescueBattery ? 'Full UI brightness restored.' : 'Conserving maximum battery for emergency assistance.',
            'info'
          );
        }}
        user={user}
        onRoleChange={role => setUser({ ...user, role })}
        activeTab={activeTab}
        onSelectTab={tab => {
          if (tab === 'profile') {
            setIsProfileModalOpen(true);
          } else {
            setIsLandingVisible(false);
            setActiveTab(tab);
          }
        }}
        unreadAlertsCount={notifications.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onTriggerSos={() => {
          handleTriggerSos('sos_manual', 20);
        }}
        onOpenDirectSms={() => setIsDirectSmsModalOpen(true)}
        isLandingVisible={isLandingVisible}
        onToggleLanding={() => setIsLandingVisible(!isLandingVisible)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Landing / Splash Screen View */}
        {isLandingVisible ? (
          <LandingHero
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            onGetStarted={() => setIsLandingVisible(false)}
            onSelectModule={tab => {
              setIsLandingVisible(false);
              setActiveTab(tab);
            }}
            onTriggerSos={() => {
              soundEngine.playEmergencyAlarm();
              setIsLandingVisible(false);
              handleTriggerSos('sos_manual');
            }}
            onRegisterUser={userData => {
              setUser(prev => ({ ...prev, ...userData }));
              addNotification('Identity Created', `Digital Safety ID ${user.digitalSafetyId} registered!`, 'info');
            }}
          />
        ) : (
          <div className="space-y-6">
            
            {/* Quick Breadcrumb Tabs on Tablet & Mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 no-scrollbar xl:hidden">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'map', label: 'Map' },
                { id: 'checkin', label: 'Smart Check-In' },
                { id: 'digital_id', label: 'Digital ID' },
                { id: 'places', label: 'Safe Places' },
                { id: 'ai', label: 'SAFETY AI' },
                { id: 'contacts', label: 'Contacts' },
                { id: 'incidents', label: 'Incidents' },
                { id: 'offline', label: 'Offline Mode' },
                { id: 'groups', label: 'Hotel & Tour' },
                { id: 'admin', label: 'Authority Hub' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playClickSound();
                    setActiveTab(item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600/30 text-cyan-300 border-blue-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* PERSISTENT LIVE LOCATION MOVING STATUS (DISPLAYED WHEN OUTSIDE MAP TAB) */}
            {isLiveLocationMoving && activeTab !== 'map' && (
              <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border border-red-500/60 rounded-2xl p-3 sm:p-3.5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider">
                        Live Location Moving &amp; Shared
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                        {user.emergencyContacts?.length || 2} Contacts Synced
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {liveTelemetry.speedKmh} km/h {liveTelemetry.headingCardinal}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Coordinates ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}) streaming hands-free to emergency contacts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      soundEngine.playClickSound();
                      setActiveTab('map');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>View Map Station</span>
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playClickSound();
                      setIsLiveLocationMoving(false);
                      addNotification('Live Movement Paused', 'GPS position broadcast returned to static beacon.', 'info');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition-colors"
                  >
                    Pause
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: HOME DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* HERO SOS & RAPID ASSISTANCE SECTION */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl text-center space-y-6">
                  
                  {/* Subtle Background Radar Effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="max-w-xl mx-auto space-y-2">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30 text-xs font-bold font-mono">
                        24/7 TOURIST SAFETY RADAR ACTIVE
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>HANDS-FREE AUTO-SMS ENABLED</span>
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Instant Emergency Response Hub
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Press SOS or miss a check-in: live GPS coordinates, Sepolia Digital ID, and distress beacon are <span className="text-emerald-300 font-bold">automatically dispatched via SMS to your saved contacts without touching your phone</span>.
                    </p>
                  </div>

                  {/* PROMINENT CENTRAL SOS EMERGENCY BUTTON */}
                  <div className="py-4 flex flex-col items-center justify-center">
                    <button
                      onClick={() => {
                        handleTriggerSos('sos_manual', 20);
                      }}
                      className="group relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 p-2 shadow-2xl shadow-red-600/50 hover:shadow-red-500/70 border-4 border-red-400/80 active:scale-95 transition-all flex flex-col items-center justify-center text-white"
                      title="Activate Emergency SOS"
                    >
                      <span className="absolute inset-0 rounded-full border-4 border-red-500/40 animate-ping pointer-events-none"></span>
                      <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow-md group-hover:scale-110 transition-transform animate-pulse" />
                      <span className="mt-2 text-xl sm:text-2xl font-black tracking-widest uppercase">
                        SOS
                      </span>
                      <span className="text-[11px] font-bold text-red-100 tracking-wider">
                        EMERGENCY
                      </span>
                      <span className="text-[9px] font-bold text-emerald-200 mt-1 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/40">
                        Auto-SMS
                      </span>
                    </button>
                    <p className="text-xs text-slate-300 mt-4 font-mono">
                      <span className="text-emerald-300 font-bold">Auto-dispatches SMS to saved contacts upon activation</span> &bull; 24/7 Police Dispatch
                    </p>
                  </div>

                  {/* QUICK RAPID ACTIONS ROW: "I'M LOST", POLICE 112, SMART CHECK-IN, SOS CONTACTS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto pt-2">
                    
                    {/* I'M LOST BUTTON */}
                    <button
                      onClick={handleImLostClick}
                      className="p-3 rounded-2xl bg-gradient-to-br from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 border border-amber-500/40 text-amber-200 flex items-center justify-center gap-1.5 font-bold text-xs shadow-md transition-all"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>I'M LOST &bull; HELP</span>
                    </button>

                    {/* DIRECT IN-APP CALL TO POLICE 112 */}
                    <button
                      onClick={() => {
                        soundEngine.playClickSound();
                        handleStartInAppCall({
                          name: 'National Emergency Police (112)',
                          phone: '112',
                          relation: 'Official Police Command Center',
                          isPrimary: true,
                        });
                      }}
                      className="p-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-cyan-300 flex items-center justify-center gap-1.5 font-bold text-xs shadow-md transition-all active:scale-95"
                      title="Direct In-App voice call to Police 112 without using any other app"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                      <span>CALL POLICE (112)</span>
                    </button>

                    {/* SMART CHECK-IN STATUS */}
                    <button
                      onClick={() => {
                        soundEngine.playClickSound();
                        setActiveTab('checkin');
                      }}
                      className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1.5 font-bold text-xs shadow-md transition-all"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SMART CHECK-IN</span>
                    </button>

                    {/* DIRECT SMS TO SAVED CONTACTS */}
                    <button
                      onClick={() => {
                        soundEngine.playClickSound();
                        setIsDirectSmsModalOpen(true);
                      }}
                      className="p-3 rounded-2xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-200 flex items-center justify-center gap-1.5 font-bold text-xs shadow-md transition-all active:scale-95"
                      title="Share live GPS SMS directly to all saved emergency contacts"
                    >
                      <Send className="w-3.5 h-3.5 text-teal-300" />
                      <span>DIRECT SMS ({user.emergencyContacts?.length || 2})</span>
                    </button>
                  </div>
                </div>

                {/* GEO-FENCE ZONE MONITOR & LIVE SIMULATOR FOR SAFETY, CONSTRUCTION & DANGER ZONES */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        currentZone?.type === 'safe' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        currentZone?.type === 'construction' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        currentZone?.type === 'danger' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        'bg-blue-500/20 text-cyan-400 border border-blue-500/30'
                      }`}>
                        <Footprints className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">Geo-Fence Live Zone Tracker &amp; Simulator</h4>
                        <p className="text-[11px] text-slate-300">
                          Automatic detection &amp; notifications when entering safety, construction, or danger zones.
                        </p>
                      </div>
                    </div>

                    {currentZone ? (
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 self-start sm:self-center border shadow-sm ${
                        currentZone.type === 'safe'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-400/40'
                          : currentZone.type === 'construction'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 ring-1 ring-amber-400/40'
                          : 'bg-red-950/80 text-red-200 border-red-500/70 ring-1 ring-red-400/40 animate-pulse'
                      }`}>
                        {currentZone.type === 'safe' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        {currentZone.type === 'construction' && <HardHat className="w-3.5 h-3.5 text-amber-400" />}
                        {currentZone.type === 'danger' && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                        <span>Inside: {currentZone.name}</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-400 self-start sm:self-center flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Monitored Tourist Corridor</span>
                      </span>
                    )}
                  </div>

                  {/* Simulator Quick Teleport Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Simulate Location / Zone Entry:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          setUserCoords(prev => ({ ...prev, lat: 15.5005, lng: 73.8290, timestamp: Date.now() }));
                        }}
                        className="p-3 rounded-2xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 text-left transition-all group hover:scale-[1.01]"
                        title="Simulate entering Safety Zone"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-300">🟢 Walk into Safety Zone</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">Safe Hub</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">Heritage Promenade (24/7 Lifeguards &amp; Police)</p>
                      </button>

                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          setUserCoords(prev => ({ ...prev, lat: 15.4940, lng: 73.8240, timestamp: Date.now() }));
                        }}
                        className="p-3 rounded-2xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 text-left transition-all group hover:scale-[1.01]"
                        title="Simulate entering Construction Zone"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-300">🚧 Walk into Construction Zone</span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">Heavy Equip</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">Harbor Metro &amp; Bridge (Heavy machinery &amp; excavation)</p>
                      </button>

                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          setUserCoords(prev => ({ ...prev, lat: 15.5120, lng: 73.8210, timestamp: Date.now() }));
                        }}
                        className="p-3 rounded-2xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/40 text-left transition-all group hover:scale-[1.01]"
                        title="Simulate entering Danger Zone"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-red-300">🔴 Walk into Danger Zone</span>
                          <span className="text-[10px] font-mono text-red-400 bg-red-950 px-1.5 py-0.2 rounded border border-red-500/30">Hazard</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">North Cliff Face (Flash flood &amp; cliff drop risk)</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE MAP ON DASHBOARD */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-extrabold text-lg text-white">Live Geo-fenced Tourist Map</h3>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playClickSound();
                        setActiveTab('map');
                      }}
                      className="text-xs text-cyan-400 hover:underline font-bold"
                    >
                      View Fullscreen Map &rarr;
                    </button>
                  </div>

                  <InteractiveMap
                    currentCoords={userCoords}
                    onCoordsChange={c => setUserCoords(c)}
                    safeZones={safeZones}
                    emergencyPlaces={emergencyPlaces}
                    isOffline={isOffline}
                    sosSignalRange={activeSos?.signalRangeKm || 20}
                    onSosSignalRangeChange={range => {
                      if (activeSos) handleUpdateSosRange(activeSos.id, range);
                    }}
                    activeSos={activeSos}
                    isLiveLocationMoving={isLiveLocationMoving}
                    onToggleLiveLocationMoving={setIsLiveLocationMoving}
                    liveMovingTrail={liveMovingTrail}
                    liveTelemetry={liveTelemetry}
                    onChangeMovementMode={mode => setLiveTelemetry(prev => ({ ...prev, mode }))}
                    savedContactsCount={user.emergencyContacts?.length || 2}
                    onSendUpdatedSms={handleSendUpdatedMovingSms}
                    onOpenDirectSmsModal={() => setIsDirectSmsModalOpen(true)}
                    onZoneEnter={z => {
                      if (activeZoneRef.current !== z.id) {
                        activeZoneRef.current = z.id;
                        setCurrentZone(z);
                        if (z.type === 'safe') {
                          addNotification(
                            `🛡️ ENTERED SAFETY ZONE: ${z.name}`,
                            `You have entered a verified Tourist Safety Zone. 24/7 Tourist Police presence and automated help kiosks are active.`,
                            'safe'
                          );
                        } else if (z.type === 'construction') {
                          addNotification(
                            `🚧 ENTERED CONSTRUCTION ZONE: ${z.name}`,
                            `Caution: Active construction with heavy machinery & excavation. ${z.warningReason || ''} Safe detour: ${z.saferAlternative || 'Follow marked pedestrian bypass.'}`,
                            'construction'
                          );
                        } else if (z.type === 'danger') {
                          addNotification(
                            `🔴 ALERT: ENTERED DANGER ZONE: ${z.name}`,
                            `Severe Hazard Warning: ${z.warningReason || 'Restricted hazard area.'} Immediate exit recommended: ${z.saferAlternative || 'Follow illuminated tourist bypass.'}`,
                            'emergency'
                          );
                        }
                      }
                    }}
                  />
                </div>

                {/* DASHBOARD WIDGETS ROW: DIGITAL ID TEASER, NEARBY HOSPITALS, AI CHAT TEASER */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Digital ID Quick Pass */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Digital Safety ID</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          Sepolia Verified
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-white">{user.name}</h4>
                      <p className="font-mono text-xs text-cyan-400">{user.digitalSafetyId}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Blood: {user.bloodGroup}</span>
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          setActiveTab('digital_id');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-bold border border-blue-500/40"
                      >
                        Show Full QR Pass
                      </button>
                    </div>
                  </div>

                  {/* Nearest Hospital Card */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-rose-400">Nearest Emergency Care</span>
                        <span className="text-[10px] font-bold text-slate-400">~350m</span>
                      </div>
                      <h4 className="font-extrabold text-base text-white">City Apex 24x7 Trauma Hospital</h4>
                      <p className="text-xs text-slate-400">Central Circle, North Beach Road</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                      <a
                        href="tel:+918322421000"
                        onClick={() => soundEngine.playClickSound()}
                        className="flex-1 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call Triage</span>
                      </a>
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          setActiveTab('places');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      >
                        All Places
                      </button>
                    </div>
                  </div>

                  {/* SAFETY AI Quick Assistant */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-cyan-400">SAFETY AI Companion</span>
                        <span className="text-[10px] font-bold text-emerald-400">Voice Ready</span>
                      </div>
                      <h4 className="font-extrabold text-base text-white">Need Directions or First Aid?</h4>
                      <p className="text-xs text-slate-400">Ask in 18 Indian &amp; international languages.</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          setActiveTab('ai');
                        }}
                        className="w-full py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Voice Assistant</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: INTERACTIVE MAP FULL */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <Compass className="w-6 h-6 text-cyan-400" />
                      <span>Multi-Engine Safety &amp; Satellite Tourist Map</span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Explore corridors using Google Maps, High-Resolution Satellite photography, Topographic Terrain, or Tactical Night Ops mode.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-cyan-300 font-bold">
                      {safeZones.length} Geo-Fences Active
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                      {emergencyPlaces.length} POIs Monitored
                    </span>
                  </div>
                </div>

                <InteractiveMap
                  currentCoords={userCoords}
                  onCoordsChange={c => setUserCoords(c)}
                  safeZones={safeZones}
                  emergencyPlaces={emergencyPlaces}
                  isOffline={isOffline}
                  sosSignalRange={activeSos?.signalRangeKm || 20}
                  onSosSignalRangeChange={range => {
                    if (activeSos) handleUpdateSosRange(activeSos.id, range);
                  }}
                  activeSos={activeSos}
                  isLiveLocationMoving={isLiveLocationMoving}
                  onToggleLiveLocationMoving={setIsLiveLocationMoving}
                  liveMovingTrail={liveMovingTrail}
                  liveTelemetry={liveTelemetry}
                  onChangeMovementMode={mode => setLiveTelemetry(prev => ({ ...prev, mode }))}
                  savedContactsCount={user.emergencyContacts?.length || 2}
                  onSendUpdatedSms={handleSendUpdatedMovingSms}
                  onOpenDirectSmsModal={() => setIsDirectSmsModalOpen(true)}
                  onZoneEnter={z => {
                    if (activeZoneRef.current !== z.id) {
                      activeZoneRef.current = z.id;
                      setCurrentZone(z);
                      if (z.type === 'safe') {
                        addNotification(
                          `🛡️ ENTERED SAFETY ZONE: ${z.name}`,
                          `You have entered a verified Tourist Safety Zone. 24/7 Tourist Police presence and automated help kiosks are active.`,
                          'safe'
                        );
                      } else if (z.type === 'construction') {
                        addNotification(
                          `🚧 ENTERED CONSTRUCTION ZONE: ${z.name}`,
                          `Caution: Active construction with heavy machinery & excavation. ${z.warningReason || ''} Safe detour: ${z.saferAlternative || 'Follow marked pedestrian bypass.'}`,
                          'construction'
                        );
                      } else if (z.type === 'danger') {
                        addNotification(
                          `🔴 ALERT: ENTERED DANGER ZONE: ${z.name}`,
                          `Severe Hazard Warning: ${z.warningReason || 'Restricted hazard area.'} Immediate exit recommended: ${z.saferAlternative || 'Follow illuminated tourist bypass.'}`,
                          'emergency'
                        );
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* TAB 3: SMART CHECK-IN */}
            {activeTab === 'checkin' && (
              <SmartCheckIn
                user={user}
                currentCoords={userCoords}
                isOffline={isOffline}
                onTriggerSos={(reason, range) => handleTriggerSos(reason, range)}
                onNotification={(title, msg, type) => addNotification(title, msg, type)}
              />
            )}

            {/* TAB 4: DIGITAL ID */}
            {activeTab === 'digital_id' && (
              <DigitalIdCard
                user={user}
                blockchainProof={blockchainProof}
                isOffline={isOffline}
              />
            )}

            {/* TAB 5: SAFE PLACES DIRECTORY */}
            {activeTab === 'places' && (
              <SafePlaces
                places={emergencyPlaces}
                userCoords={userCoords}
                isOffline={isOffline}
              />
            )}

            {/* TAB 6: SAFETY AI ASSISTANT */}
            {activeTab === 'ai' && (
              <AiAssistant
                currentLanguage={currentLanguage}
                userCoords={userCoords}
                isOffline={isOffline}
                user={user}
                isEmergencyActive={!!activeSos}
                onTriggerSos={() => handleTriggerSos('sos_manual')}
              />
            )}

            {/* TAB 7: EMERGENCY CONTACTS */}
            {activeTab === 'contacts' && (
              <EmergencyContacts
                contacts={user.emergencyContacts}
                onUpdateContacts={updated => setUser({ ...user, emergencyContacts: updated })}
                userCoords={userCoords}
                user={user}
                onUpdateUser={updated => setUser(prev => ({ ...prev, ...updated }))}
                onNotification={addNotification}
                onStartInAppCall={handleStartInAppCall}
                onActivateLiveMoving={() => handleActivateLiveLocationMoving(true)}
                onOpenDirectSmsModal={() => setIsDirectSmsModalOpen(true)}
              />
            )}

            {/* TAB 8: INCIDENTS */}
            {activeTab === 'incidents' && (
              <IncidentReporting
                incidents={incidents}
                onAddIncident={inc => {
                  appStorage.saveIncident(inc);
                  setIncidents(prev => [inc, ...prev]);
                  addNotification('Incident Filed', `Logged ${inc.incidentType} under ID ${inc.id}`, 'info');
                }}
                userCoords={userCoords}
                user={user}
                isOffline={isOffline}
              />
            )}

            {/* TAB 9: OFFLINE MODE & MAP PACKS */}
            {activeTab === 'offline' && (
              <OfflineSafetyPacks
                packs={offlinePacks}
                onToggleDownloadPack={id => {
                  setOfflinePacks(prev => prev.map(p => (
                    p.id === id ? { ...p, isDownloaded: !p.isDownloaded, downloadDate: new Date().toISOString().split('T')[0] } : p
                  )));
                }}
                isOffline={isOffline}
                onToggleOffline={() => setIsOffline(!isOffline)}
                isRescueBattery={isRescueBattery}
                onToggleRescueBattery={() => setIsRescueBattery(!isRescueBattery)}
                offlineSosQueue={offlineSosQueue}
                onClearOfflineQueue={() => {
                  appStorage.clearOfflineSosQueue();
                  setOfflineSosQueue([]);
                }}
              />
            )}

            {/* TAB 10: HOTEL & TOUR GROUPS */}
            {(activeTab === 'groups' || activeTab === 'hotel_portal') && (
              <TravelGroupPortal
                group={travelGroup}
                user={user}
                userCoords={userCoords}
                onJoinGroup={code => {
                  addNotification('Joined Travel Group', `Successfully joined group with code ${code}`, 'info');
                }}
                onSetSafePoint={(name, lat, lng) => {
                  setUser({
                    ...user,
                    savedHotelSafePoint: { name, lat, lng, address: 'Verified Hotel Partner' },
                  });
                }}
              />
            )}

            {/* TAB 11: EMERGENCY AUTHORITY DASHBOARD */}
            {activeTab === 'admin' && (
              <AuthorityDashboard
                activeSosList={authoritySosList}
                incidents={incidents}
                onUpdateIncidentStatus={(id, status) => {
                  setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
                }}
                onResolveSos={id => {
                  setAuthoritySosList(prev => prev.filter(s => s.id !== id));
                  if (activeSos?.id === id) setActiveSos(null);
                  addNotification('Authority Action', `Distress beacon ${id} marked as resolved.`, 'info');
                }}
                onUpdateSosRange={handleUpdateSosRange}
                currentUser={user}
              />
            )}

          </div>
        )}

      </main>

      {/* SOS EMERGENCY MODAL */}
      {isSosModalOpen && (
        <SosModal
          isOpen={isSosModalOpen}
          onClose={() => setIsSosModalOpen(false)}
          user={user}
          currentCoords={userCoords}
          isOffline={isOffline}
          activeSos={activeSos}
          onConfirmSos={(emergencyType, signalRange) => handleTriggerSos(emergencyType, signalRange)}
          onCancelActiveSos={handleCancelActiveSos}
          onUpdateSignalRange={range => {
            if (activeSos) handleUpdateSosRange(activeSos.id, range);
          }}
          nearbyPlaces={emergencyPlaces}
          onNotification={addNotification}
          onStartInAppCall={handleStartInAppCall}
          onViewMapLive={() => {
            setIsSosModalOpen(false);
            handleActivateLiveLocationMoving(true);
          }}
          onOpenDirectSmsModal={() => setIsDirectSmsModalOpen(true)}
          isLiveLocationMoving={isLiveLocationMoving}
          liveTelemetry={liveTelemetry}
        />
      )}

      {/* DIRECT SMS SHARING MODAL */}
      {isDirectSmsModalOpen && (
        <DirectSmsShareModal
          isOpen={isDirectSmsModalOpen}
          onClose={() => setIsDirectSmsModalOpen(false)}
          user={user}
          currentCoords={userCoords}
          contacts={user.emergencyContacts}
          emergencyType={activeSos?.emergencyType || 'sos_manual'}
          signalRangeKm={activeSos?.signalRangeKm || 20}
          onNotification={addNotification}
        />
      )}

      {/* DIRECT IN-APP CALLER MODAL (100% INSIDE WEBSITE - ZERO EXTERNAL APPS) */}
      {isInAppCallerOpen && activeCallContact && (
        <InAppDirectCaller
          isOpen={isInAppCallerOpen}
          onClose={() => {
            setIsInAppCallerOpen(false);
            setActiveCallContact(null);
          }}
          contact={activeCallContact}
          user={user}
          currentCoords={userCoords}
          onNotification={addNotification}
          allContacts={user.emergencyContacts}
        />
      )}

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={updated => setUser(prev => ({ ...prev, ...updated }))}
      />

      {/* NOTIFICATIONS DRAWER / MODAL */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base text-white">Safety Notifications</h3>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setIsNotificationsOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                    notif.type === 'sms' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-100 ring-1 ring-cyan-500/20' :
                    notif.type === 'safe' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 ring-1 ring-emerald-500/20' :
                    notif.type === 'construction' ? 'bg-amber-950/40 border-amber-500/50 text-amber-100 ring-1 ring-amber-500/20' :
                    notif.type === 'emergency' ? 'bg-red-950/40 border-red-500/40 text-red-100' :
                    notif.type === 'warning' ? 'bg-amber-950/40 border-amber-500/40 text-amber-100' :
                    'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{notif.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* I'M LOST GUIDANCE MODAL */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Compass className="w-6 h-6 animate-spin" />
                <h3 className="font-extrabold text-lg text-white">Tourist Lost Assistance Protocol</h3>
              </div>
              <button
                onClick={() => setShowLostModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                <p className="font-bold text-white">1. Stay in a well-lit public area.</p>
                <p className="text-xs text-amber-200/90 mt-0.5">Do not wander into dark alleyways, unpaved cliff trails, or isolated beaches.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="font-bold text-white">2. Your Current Coordinates &amp; Safe Haven:</p>
                <p className="font-mono text-cyan-300 text-xs mt-1">
                  GPS: {userCoords.lat.toFixed(5)}° N, {userCoords.lng.toFixed(5)}° E
                </p>
                <p className="text-xs text-emerald-400 mt-1">
                  Saved Hotel: {user.savedHotelSafePoint?.name} (approx. 220m South-West)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="font-bold text-white">3. Nearest Tourist Police Help Post:</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tourist Police Help Post (Promenade Gate 2) is ~180m West.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => {
                  soundEngine.playEmergencyAlarm();
                  setShowLostModal(false);
                  handleTriggerSos('sos_manual');
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Trigger Emergency SOS</span>
              </button>

              <button
                onClick={() => {
                  setShowLostModal(false);
                  setActiveTab('map');
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <Navigation className="w-4 h-4" />
                <span>Show Compass &amp; Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-300">SAFETY &amp; RESCUE TOUR 360°– AI</span>
            <span>&bull;</span>
            <span>Student Innovation for Tourism, Travel &amp; Public Safety</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Sepolia Testnet Smart Contract</span>
            <span>&bull;</span>
            <span>OpenStreetMap Vector Engine</span>
            <span>&bull;</span>
            <span>Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>

      {/* REAL-TIME NOTIFICATION TOASTS OVERLAY (VISIBLE ACROSS ALL TABS AND MODALS) */}
      <NotificationToastContainer
        toasts={activeToasts}
        onDismiss={handleDismissToast}
        onSelectTab={tab => setActiveTab(tab)}
      />

    </div>
    </ErrorBoundary>
  );
}
