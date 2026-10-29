/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, LocationCoordinate } from '../types';
import { soundEngine } from '../utils/audio';
import { User as UserIcon, Heart, Shield, Phone, FileText, CheckCircle, X } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updated: Partial<User>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [name, setName] = useState(user.name);
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || 'O+');
  const [allergies, setAllergies] = useState(user.allergies || '');
  const [medicalNotes, setMedicalNotes] = useState(user.medicalNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClickSound();
    onUpdateUser({
      name,
      bloodGroup,
      allergies,
      medicalNotes,
    });
    setSavedSuccess(true);
    soundEngine.playSuccessChime();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-lg text-white">Tourist Profile &amp; Medical Disclosures</h3>
          </div>
          <button
            onClick={() => {
              soundEngine.playClickSound();
              onClose();
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Profile and emergency health disclosures updated!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 font-bold block mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Digital Safety ID</label>
              <input
                type="text"
                disabled
                value={user.digitalSafetyId}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">Known Allergies / Rx</label>
            <input
              type="text"
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts, Bee venom"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">Emergency Medical Notes</label>
            <textarea
              rows={3}
              value={medicalNotes}
              onChange={e => setMedicalNotes(e.target.value)}
              placeholder="e.g. Asthma inhaler in left backpack pouch; diabetic; wears contact lenses"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md shadow-blue-600/30"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
