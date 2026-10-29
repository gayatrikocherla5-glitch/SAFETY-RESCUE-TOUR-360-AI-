/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SafeZone, EmergencyPlace, User, SosAlert, IncidentReport, SmartCheckInSession, TravelGroup, OfflinePack, BlockchainProof } from '../types';

export const INITIAL_USER: User = {
  id: 'usr_94821',
  name: 'Gayatri Kocherla',
  email: 'gayatrikocherla5@gmail.com',
  phone: '+91 98490 12345',
  nationality: 'Indian',
  bloodGroup: 'O+',
  allergies: 'Penicillin, Dust mite',
  medicalNotes: 'Asthma inhaler in backpack side pocket. Contact lenses.',
  digitalSafetyId: 'SRT-2026-IND-94821',
  qrCodeData: 'SRT360:V1:usr_94821:SRT-2026-IND-94821:ETH-SEP-0x892aF',
  createdAt: '2026-09-20T08:30:00.000Z',
  role: 'tourist',
  batteryLevel: 68,
  isRescueBatteryActive: false,
  handsFreeSmsEnabled: true,
  autoSmsOnDangerZone: true,
  autoSmsOnCheckInTimeout: true,
  savedHotelSafePoint: {
    name: 'Grand Horizon Beach Resort & Suites',
    lat: 15.4989,
    lng: 73.8278,
    address: 'Seaside Boulevard, North Shore Enclave, Goa',
  },
  emergencyContacts: [
    {
      id: 'c1',
      name: 'Ramesh Kocherla',
      relation: 'Parent / Father',
      phone: '+91 98490 67890',
      email: 'ramesh.k@example.com',
      isPrimary: true,
      shareLiveLocation: true,
    },
    {
      id: 'c2',
      name: 'Dr. Priya Sharma',
      relation: 'Family Physician & Guardian',
      phone: '+91 94401 23456',
      isPrimary: false,
      shareLiveLocation: true,
    },
    {
      id: 'c3',
      name: 'Vikram Mehta',
      relation: 'Tour Group Leader',
      phone: '+91 98112 54321',
      isPrimary: false,
      shareLiveLocation: true,
    },
  ],
};

export const INITIAL_SAFE_ZONES: SafeZone[] = [
  {
    id: 'sz_1',
    name: 'Central Heritage Promenade & Beach Safety Zone',
    type: 'safe',
    description: 'Fully illuminated tourist corridor with 24x7 Tourist Police presence and automated lifeguard stations.',
    center: [15.5005, 73.8290],
    radiusMeters: 450,
    warningReason: '',
    saferAlternative: '',
  },
  {
    id: 'sz_2',
    name: 'Old Town Cultural Plaza Safety Corridor',
    type: 'safe',
    description: 'Pedestrian-only heritage zone with automated emergency call boxes and rapid response medical units.',
    center: [15.5050, 73.8340],
    radiusMeters: 380,
  },
  {
    id: 'cz_1',
    name: 'Harbor Metro & Coastal Bridge Construction Zone',
    type: 'construction',
    description: 'Active urban infrastructure development with heavy machinery, open excavation, and pedestrian detours.',
    center: [15.4940, 73.8240],
    radiusMeters: 320,
    warningReason: 'Heavy crane machinery, ongoing excavation, overhead hazard, and uneven slippery gravel.',
    saferAlternative: 'Follow marked pedestrian skywalk detour on North Avenue (Zone Green A).',
  },
  {
    id: 'dz_1',
    name: 'North Cliff Face & Flash Flood Danger Zone',
    type: 'danger',
    description: 'Unfenced vertical drop-off and seasonal flash flood surge area. Restricted hazard zone.',
    center: [15.5120, 73.8210],
    radiusMeters: 280,
    warningReason: 'Severe fall hazard, crumbling cliff edge, and turbulent tidal surge with zero cellular reception.',
    saferAlternative: 'Take the illuminated Tourist Bypass road 300m East to Lighthouse Vista.',
  },
];

export const INITIAL_EMERGENCY_PLACES: EmergencyPlace[] = [
  {
    id: 'ep_1',
    name: 'City Apex 24x7 Trauma & Emergency Hospital',
    type: 'hospital',
    lat: 15.5020,
    lng: 73.8315,
    phone: '+91 832 242 1000',
    address: 'Near Central Circle, North Beach Road',
    isOpen24x7: true,
  },
  {
    id: 'ep_2',
    name: 'Tourist Police Help & Rapid Response Post',
    type: 'police',
    lat: 15.4995,
    lng: 73.8265,
    phone: '112 / +91 832 241 4100',
    address: 'Promenade Gate 2, Tourist Safety Center',
    isOpen24x7: true,
  },
  {
    id: 'ep_3',
    name: 'Coastal Fire & Ocean Rescue Station',
    type: 'fire',
    lat: 15.5065,
    lng: 73.8370,
    phone: '101 / +91 832 242 0101',
    address: 'Avenue 4, Harbor Approach',
    isOpen24x7: true,
  },
  {
    id: 'ep_4',
    name: '360° Tourist Assistance & Verification Kiosk',
    type: 'tourist_help',
    lat: 15.5000,
    lng: 73.8285,
    phone: '1800-233-3600',
    address: 'Central Plaza Tourist Info Pavillion',
    isOpen24x7: true,
  },
  {
    id: 'ep_5',
    name: 'MedPlus 24-Hour Tourist Pharmacy & First Aid',
    type: 'pharmacy',
    lat: 15.5012,
    lng: 73.8302,
    phone: '+91 832 242 5599',
    address: 'Shop 14, Heritage Square Mall',
    isOpen24x7: true,
  },
  {
    id: 'ep_6',
    name: 'Grand Horizon Beach Resort & Suites',
    type: 'hotel',
    lat: 15.4989,
    lng: 73.8278,
    phone: '+91 832 665 0000',
    address: 'Seaside Boulevard, North Shore Enclave',
    isOpen24x7: true,
  },
];

export const INITIAL_OFFLINE_PACKS: OfflinePack[] = [
  {
    id: 'pack_goa',
    name: 'Goa Coastal & Heritage Safety Zone',
    region: 'Goa, India',
    sizeMb: 42.4,
    isDownloaded: true,
    downloadDate: '2026-09-21',
    features: ['High-res vector map', 'Safe & danger geo-fences', 'Lifeguard stations', '6 Emergency Hospitals', '18 Offline Emergency Phrases'],
  },
  {
    id: 'pack_himachal',
    name: 'Himachal Parvati & Kullu Valley Trek Safety',
    region: 'Himachal Pradesh, India',
    sizeMb: 58.2,
    isDownloaded: false,
    features: ['Mountain contour trail maps', 'High altitude shelter GPS', 'Avalanche & landslide geo-fences', 'Rescue chopper landing pads'],
  },
  {
    id: 'pack_rajasthan',
    name: 'Jaipur & Rajasthan Golden Triangle Heritage',
    region: 'Rajasthan, India',
    sizeMb: 48.0,
    isDownloaded: false,
    features: ['Fort & Palace offline routing', 'Tourist Police booths', 'Desert navigation safety', 'Multilingual Hindi/Marwari audio phrases'],
  },
  {
    id: 'pack_kerala',
    name: 'Kerala Backwaters & Munnar Tea Trails',
    region: 'Kerala, India',
    sizeMb: 51.5,
    isDownloaded: false,
    features: ['Backwater ferry emergency points', 'Elephant corridor geo-fences', 'Ayurvedic & allopathic clinics'],
  },
];

export const INITIAL_TRAVEL_GROUP: TravelGroup = {
  id: 'grp_sun_2026',
  name: 'Sun & Sea Explorer Group (Goa 2026)',
  leaderId: 'c3',
  leaderName: 'Vikram Mehta (Certified Tour Leader)',
  joinCode: 'TOUR-GOA-360',
  itinerary: 'Fort Aguada → Heritage Promenade → Sunset Point → Beach Enclave',
  members: [
    {
      id: 'usr_94821',
      name: 'Gayatri Kocherla (You)',
      role: 'member',
      lastCoords: { lat: 15.5002, lng: 73.8282, timestamp: Date.now() },
      lastSeen: Date.now(),
      battery: 68,
      isSafe: true,
      phone: '+91 98490 12345',
    },
    {
      id: 'm2',
      name: 'Vikram Mehta',
      role: 'leader',
      lastCoords: { lat: 15.5009, lng: 73.8295, timestamp: Date.now() - 120000 },
      lastSeen: Date.now() - 120000,
      battery: 84,
      isSafe: true,
      phone: '+91 98112 54321',
    },
    {
      id: 'm3',
      name: 'Aanya Sen',
      role: 'member',
      lastCoords: { lat: 15.5015, lng: 73.8301, timestamp: Date.now() - 300000 },
      lastSeen: Date.now() - 300000,
      battery: 52,
      isSafe: true,
      phone: '+91 97110 99887',
    },
    {
      id: 'm4',
      name: 'Rohan Gupta',
      role: 'member',
      lastCoords: { lat: 15.4991, lng: 73.8272, timestamp: Date.now() - 45000 },
      lastSeen: Date.now() - 45000,
      battery: 41,
      isSafe: true,
      phone: '+91 98223 11223',
    },
  ],
};

export const INITIAL_BLOCKCHAIN_PROOF: BlockchainProof = {
  contractAddress: '0x71C94B3b7f83C9029a1E06aF568A57143e11A29c',
  chainId: 11155111,
  chainName: 'Ethereum Sepolia Testnet',
  txHash: '0x8f4d92a10b7e4168c92b23a9b1c098df24119e83ca914b3017f8a7192bc581ae',
  blockNumber: 6294812,
  timestamp: 1774251600000,
  digitalSafetyId: 'SRT-2026-IND-94821',
  merkleRoot: '0x4f128bcde903847291aeb6c9349817293847a1928374bcf9384729103847192a',
  digitalSignature: '0x39a1b0284710293847cdef928374619283746a51827364918273645192837465',
  status: 'verified_on_chain',
  explorerUrl: 'https://sepolia.etherscan.io/tx/0x8f4d92a10b7e4168c92b23a9b1c098df24119e83ca914b3017f8a7192bc581ae',
};

// Storage helper class
class AppStorage {
  private offlineSosQueueKey = 'srt_offline_sos_queue';
  private incidentsKey = 'srt_incident_reports';
  private customZonesKey = 'srt_custom_zones';

  public getOfflineSosQueue(): SosAlert[] {
    try {
      const data = localStorage.getItem(this.offlineSosQueueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public enqueueOfflineSos(alert: SosAlert) {
    try {
      const queue = this.getOfflineSosQueue();
      queue.unshift(alert);
      localStorage.setItem(this.offlineSosQueueKey, JSON.stringify(queue));
    } catch {}
  }

  public clearOfflineSosQueue() {
    try {
      localStorage.removeItem(this.offlineSosQueueKey);
    } catch {}
  }

  public getIncidents(): IncidentReport[] {
    try {
      const data = localStorage.getItem(this.incidentsKey);
      if (data) return JSON.parse(data);
    } catch {}
    // default seed incidents for realistic demo
    return [
      {
        id: 'INC-2026-8812',
        userId: 'usr_guest_4',
        userName: 'Elena Rostova',
        incidentType: 'lost_person',
        description: 'Separated from trekking group near North Coastal Ridge trail markers.',
        location: {
          address: 'North Coastal Trail, Sector 4',
          lat: 15.5115,
          lng: 73.8220,
        },
        timestamp: Date.now() - 3600000 * 2,
        severity: 'high',
        status: 'investigating',
      },
      {
        id: 'INC-2026-8790',
        userId: 'usr_guest_9',
        userName: 'David Miller',
        incidentType: 'unsafe_location',
        description: 'Broken handrail and slick rocks near High Tide Point, saw tourist slip.',
        location: {
          address: 'High Tide Rocky Point',
          lat: 15.4942,
          lng: 73.8238,
        },
        timestamp: Date.now() - 3600000 * 6,
        severity: 'medium',
        status: 'reported',
      },
      {
        id: 'INC-2026-8650',
        userId: 'usr_94821',
        userName: 'Gayatri Kocherla',
        incidentType: 'harassment',
        description: 'Aggressive unauthorized beach vendor refusing to let solo traveler pass.',
        location: {
          address: 'South Beach Shack Entry 3',
          lat: 15.4970,
          lng: 73.8260,
        },
        timestamp: Date.now() - 3600000 * 24,
        severity: 'low',
        status: 'resolved',
      },
    ];
  }

  public saveIncident(incident: IncidentReport) {
    try {
      const list = this.getIncidents();
      list.unshift(incident);
      localStorage.setItem(this.incidentsKey, JSON.stringify(list));
    } catch {}
  }
}

export const appStorage = new AppStorage();
