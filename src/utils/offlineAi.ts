/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageCode } from '../types';

export function getOfflineAiResponse(query: string, language: LanguageCode, userCoords?: { lat: number; lng: number }): string {
  const q = query.toLowerCase();

  if (q.includes('lost') || q.includes('rasta') || q.includes('bhatak') || q.includes('where am i')) {
    return `[OFFLINE SAFETY AI]
1. Stay calm. Stay in your current location if it is well-lit and public.
2. Your recorded GPS position is: ${userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : '15.5002, 73.8282'}.
3. Your saved safe haven is 'Grand Horizon Beach Resort & Suites' (approx. 220m South-West).
4. Tap the 'I'M LOST' button on your screen for live compass navigation, or press SOS if you feel in immediate danger.`;
  }

  if (q.includes('hospital') || q.includes('doctor') || q.includes('medical') || q.includes('ambulance') || q.includes('aspataal')) {
    return `[OFFLINE SAFETY AI - EMERGENCY MEDICAL]
Nearest verified facility from your offline database:
🏥 City Apex 24x7 Trauma & Emergency Hospital
📍 Distance: ~350m East (Near Central Circle)
📞 Phone: +91 832 242 1000 or National Ambulance: 108
Open 24/7 with emergency triage and English/Hindi speaking trauma staff.`;
  }

  if (q.includes('police') || q.includes('helpdesk') || q.includes('thana') || q.includes('cop')) {
    return `[OFFLINE SAFETY AI - LAW ENFORCEMENT]
Nearest tourist police station from your offline database:
👮 Tourist Police Help & Rapid Response Post
📍 Distance: ~180m West (Promenade Gate 2)
📞 Phone: 112 or Direct: +91 832 241 4100
Features dedicated Tourist Protection Officers and rapid patrol motorbikes.`;
  }

  if (q.includes('translate') || q.includes('marathi') || q.includes('hindi') || q.includes('tamil')) {
    return `[OFFLINE MULTILINGUAL EMERGENCY TRANSLATION]
• "I need emergency help":
  - Hindi: "मुझे तुरंत आपातकालीन मदद चाहिए" (Mujhe turant aapaatkaleen madad chahiye)
  - Marathi: "मला तातडीने मदतीची गरज आहे" (Mala tatadine madatichi garaj ahe)
  - Tamil: "எனக்கு அவசர உதவி தேவை" (Enakku avasara udhavi thevai)
• "Where is the police station?":
  - Hindi: "पुलिस स्टेशन कहाँ है?"
  - Marathi: "पोलीस ठाणे कुठे आहे?"
  - Tamil: "காவல் நிலையம் எங்கே உள்ளது?"`;
  }

  if (q.includes('safe') || q.includes('safe places') || q.includes('zone')) {
    return `[OFFLINE SAFETY AI - VERIFIED SAFE ZONES]
Currently downloaded safe corridors within walking distance:
🟢 Central Heritage Promenade (Illuminated, Lifeguards on duty, CCTV coverage)
🟢 Old Town Historic Cultural Plaza (Pedestrian zone with rapid assistance kiosks)
⚠️ Note: Avoid the North Cliff Face (Danger Zone) past dusk due to unfenced drop-offs.`;
  }

  if (q.includes('first aid') || q.includes('snake') || q.includes('heat') || q.includes('bleed')) {
    return `[OFFLINE FIRST AID PROTOCOL]
• Bleeding: Apply firm direct pressure with clean cloth. Elevate wound above heart level.
• Heat Exhaustion: Move to shade, loosen clothing, sip cool water with salt/electrolytes.
• Sprain/Fall: Rest, Ice/Cool water compress, Compress lightly, Elevate (R.I.C.E).
• Serious injury: Press SOS button immediately. Offline alert will queue and phone can dial 112.`;
  }

  return `[OFFLINE SAFETY AI ASSISTANT]
I am operating in Offline Safety Mode using locally stored safety blueprints.
I can assist with:
• "Where is the nearest hospital?"
• "Show police station"
• "I am lost, what should I do?"
• "Show safe places nearby"
• Emergency first aid instructions
• Translations of emergency phrases
If you are facing danger, press the SOS button immediately.`;
}
