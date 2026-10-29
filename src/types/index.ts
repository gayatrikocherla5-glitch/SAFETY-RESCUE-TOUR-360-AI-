/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageCode =
  | 'en' // English
  | 'hi' // Hindi (हिन्दी)
  | 'te' // Telugu (తెలుగు)
  | 'as' // Assamese (অসমীয়া)
  | 'bn' // Bengali (বাংলা)
  | 'doi' // Dogri (डोगरी)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ks' // Kashmiri (کٲشُر / डोगरी)
  | 'kok' // Konkani (कोंकणी)
  | 'mai' // Maithili (मैथिली)
  | 'ml' // Malayalam (മലയാളം)
  | 'mni' // Manipuri (ꯃꯤꯇꯩꯂꯣꯟ)
  | 'mr' // Marathi (मराठी)
  | 'ne' // Nepali (नेपाली)
  | 'or' // Odia (ଓଡ଼ିଆ)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'ta'; // Tamil (தமிழ்)

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  shareLiveLocation: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
  digitalSafetyId: string;
  qrCodeData: string;
  createdAt: string;
  emergencyContacts: EmergencyContact[];
  travelGroupId?: string;
  role: 'tourist' | 'admin' | 'hotel' | 'responder';
  batteryLevel: number;
  isRescueBatteryActive: boolean;
  handsFreeSmsEnabled?: boolean;
  autoSmsOnDangerZone?: boolean;
  autoSmsOnCheckInTimeout?: boolean;
  savedHotelSafePoint?: {
    name: string;
    lat: number;
    lng: number;
    address: string;
  };
}

export interface LocationCoordinate {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
  speed?: number;
  altitude?: number;
}

export type ZoneType = 'safe' | 'caution' | 'danger' | 'construction';

export interface SafetyNotification {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'warning' | 'info' | 'safe' | 'construction' | 'sms';
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
  details?: string;
}

export interface SafeZone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  center: [number, number];
  radiusMeters: number;
  polygon?: [number, number][];
  warningReason?: string;
  saferAlternative?: string;
}

export type PlaceType = 
  | 'hospital' 
  | 'police' 
  | 'fire' 
  | 'tourist_help' 
  | 'pharmacy' 
  | 'hotel' 
  | 'transit';

export interface EmergencyPlace {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lng: number;
  phone: string;
  address: string;
  isOpen24x7: boolean;
  distanceKm?: number;
}

export interface SmsDispatchRecord {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  relation: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  messageText: string;
  gateway: 'GSM_CELLULAR_TELECOM' | 'SATELLITE_RELAY' | 'WEB_SMS_PROTOCOL' | 'HANDS_FREE_TELECOM_GATEWAY' | 'DIRECT_AUTOMATED_CELLULAR_GATEWAY';
  deliveryAckCode: string;
  smsUri: string;
  triggerSource?: 'panic_button' | 'smart_checkin_timeout' | 'danger_zone_entry' | 'fall_detection' | 'voice_hotword';
}

export type SosSignalRangeKm = 10 | 20 | 50 | 100;

export interface SosAlert {
  id: string;
  userId: string;
  userName: string;
  digitalSafetyId: string;
  coordinates: LocationCoordinate;
  coords?: LocationCoordinate;
  timestamp: number;
  status: 'active' | 'assigned' | 'resolved' | 'queued';
  emergencyType: 'sos_manual' | 'sos_auto_checkin' | 'danger_zone_breach' | 'medical' | 'lost';
  batteryStatus: number;
  batteryLevel?: number;
  networkStatus: 'online' | 'offline_queued' | 'cellular_sms';
  isOfflineQueued?: boolean;
  transmissionStatus: 'transmitted' | 'pending_sync' | 'mesh_relayed';
  assignedResponder?: string;
  notes?: string;
  signalRangeKm?: SosSignalRangeKm;
  autoEscalateRange?: boolean;
  smsDispatchLog?: SmsDispatchRecord[];
  reachEstimate?: {
    respondersCount: number;
    hospitalsCount: number;
    policeStationsCount: number;
    coastalGuardHubs?: number;
    civilDefenseBase?: boolean;
    satelliteNavRelay?: boolean;
  };
}

export interface IncidentReport {
  id: string;
  userId: string;
  userName?: string;
  incidentType: 
    | 'lost_person'
    | 'missing_group_member'
    | 'harassment'
    | 'accident'
    | 'unsafe_location'
    | 'medical_emergency'
    | 'suspicious_activity'
    | 'theft'
    | 'other';
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'in_progress' | 'resolved';
  mediaUrl?: string;
}

export interface SmartCheckInSession {
  id: string;
  intervalSeconds: number; // e.g. 30, 300, 600, 900, 1800
  startedAt: number;
  nextCheckAt: number;
  status: 'monitoring' | 'prompt_active' | 'warning_grace' | 'missed_alert' | 'safe_reset' | 'sos_triggered';
  missedCount: number;
  maxMissedAllowed: number;
  travelMode: 'active_journey' | 'transit' | 'hotel_safe' | 'hiking';
  journeyNote: string;
}

export interface TravelGroupMember {
  id: string;
  name: string;
  role: 'leader' | 'guide' | 'member';
  lastCoords: LocationCoordinate;
  lastSeen: number;
  battery: number;
  isSafe: boolean;
  phone: string;
}

export interface TravelGroup {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  joinCode: string;
  itinerary: string;
  members: TravelGroupMember[];
}

export interface BlockchainProof {
  contractAddress: string;
  chainId: number;
  chainName: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  digitalSafetyId: string;
  merkleRoot: string;
  digitalSignature: string;
  status: 'verified_on_chain';
  explorerUrl: string;
}

export interface OfflinePack {
  id: string;
  name: string;
  region: string;
  sizeMb: number;
  isDownloaded: boolean;
  downloadDate?: string;
  features: string[];
}

export interface ActiveInAppCall {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientRelation: string;
  recipientType: 'contact' | 'police' | 'medical' | 'guide';
  startTime: number;
  status: 'requesting_permission' | 'ringing' | 'connected' | 'ended' | 'failed';
  isMuted: boolean;
  isSpeakerOn: boolean;
  microphoneGranted: boolean;
  lastTranscript?: string;
  durationSeconds: number;
  coordinates: LocationCoordinate;
}

export interface CallHistoryRecord {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientRelation: string;
  timestamp: number;
  durationSeconds: number;
  status: 'completed' | 'missed' | 'emergency_broadcast';
  coordinates: LocationCoordinate;
}

export interface LiveMovementTelemetry {
  isMoving: boolean;
  speedKmh: number;
  headingDeg: number;
  headingCardinal: string;
  distanceTraveledMeters: number;
  mode: 'walk' | 'run' | 'vehicle';
  lastBroadcastTimestamp: number;
  contactsAlertedCount: number;
}
