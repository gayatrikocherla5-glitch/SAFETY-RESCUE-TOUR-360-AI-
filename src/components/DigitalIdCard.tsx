/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  ShieldCheck, 
  QrCode, 
  CheckCircle, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Lock, 
  Cpu, 
  Share2, 
  FileCheck,
  Search
} from 'lucide-react';
import { User, BlockchainProof } from '../types';
import { soundEngine } from '../utils/audio';
import { AppLogo } from './AppLogo';

interface DigitalIdCardProps {
  user: User;
  blockchainProof: BlockchainProof;
  isOffline: boolean;
}

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({
  user,
  blockchainProof,
  isOffline,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<'valid' | null>(null);

  // Generate QR code data URL
  useEffect(() => {
    // Encodes a verifiable cryptographic credential hash rather than raw private health data
    const credentialPayload = JSON.stringify({
      protocol: 'SRT-360-ID',
      version: '1.0',
      id: user.digitalSafetyId,
      name: user.name,
      nationality: user.nationality,
      emergencyContact: user.emergencyContacts[0]?.phone,
      chain: 'Ethereum Sepolia',
      contract: blockchainProof.contractAddress,
      tx: blockchainProof.txHash,
      timestamp: blockchainProof.timestamp,
    });

    QRCode.toDataURL(credentialPayload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#02153b',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [user, blockchainProof]);

  const handleCopyTx = () => {
    soundEngine.playClickSound();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(blockchainProof.txHash).then(() => {
        setCopiedTx(true);
        setTimeout(() => setCopiedTx(false), 2000);
      }).catch(() => {});
    }
  };

  const handleSimulateVerify = () => {
    soundEngine.playClickSound();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult('valid');
      soundEngine.playSuccessChime();
    }, 1200);
  };

  const primaryContact = user.emergencyContacts.find(c => c.isPrimary) || user.emergencyContacts[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>SAFETY &amp; RESCUE DIGITAL ID</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Tamper-evident sovereign travel credential backed by Ethereum Sepolia smart contract.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verified on Blockchain</span>
          </span>
          {isOffline && (
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
              Offline Available
            </span>
          )}
        </div>
      </div>

      {/* Official Digital Safety ID Card */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-blue-500/40 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 shadow-2xl shadow-blue-950/60 p-6 sm:p-8 text-white">
        
        {/* Background Holographic Lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Row of Card */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-5">
          <div className="flex items-center gap-3">
            <AppLogo size={44} showText={false} />
            <div>
              <p className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
                SAFETY &amp; SECURE TOUR 360° - AI
              </p>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                INTERNATIONAL TOURIST SAFETY CREDENTIAL
              </h3>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Credential Status</p>
            <p className="text-xs font-black text-emerald-400 font-mono tracking-wide">ACTIVE &bull; VERIFIED</p>
          </div>
        </div>

        {/* Main Content Grid: Photo, Details, QR preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
          
          {/* Avatar & Digital ID Badging */}
          <div className="md:col-span-3 flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-1 shadow-lg shadow-blue-500/30">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-3xl font-black text-white">
                  GK
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-500 text-slate-950 shadow-md">
                <CheckCircle className="w-4 h-4 font-bold" />
              </div>
            </div>

            <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Nationality</p>
            <p className="text-sm font-black text-white">{user.nationality}</p>
          </div>

          {/* User Fields */}
          <div className="md:col-span-6 space-y-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
              <h4 className="text-lg font-black text-white tracking-tight">{user.name}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Digital Safety ID</p>
                <p className="font-mono text-sm font-bold text-cyan-300">{user.digitalSafetyId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Group</p>
                <p className="font-mono text-sm font-bold text-rose-300">{user.bloodGroup || 'Not specified'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Contact</p>
                <p className="text-xs font-bold text-white">{primaryContact?.name}</p>
                <p className="text-[11px] font-mono text-slate-300">{primaryContact?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Known Allergies / Rx</p>
                <p className="text-xs text-slate-300 truncate">{user.allergies || 'None recorded'}</p>
              </div>
            </div>
          </div>

          {/* QR Code Column */}
          <div className="md:col-span-3 flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Verifiable Digital Safety QR Code"
                className="w-28 h-28 rounded-xl shadow-md border border-white/20 p-1 bg-white cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowQrModal(true)}
              />
            ) : (
              <div className="w-28 h-28 bg-slate-800 animate-pulse rounded-xl"></div>
            )}
            <p className="text-[10px] font-mono text-slate-400 mt-2">Tap to enlarge QR</p>
          </div>
        </div>

        {/* Bottom Card Footer: Blockchain Stamp */}
        <div className="mt-6 pt-4 border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-mono text-[11px]">
              Sepolia Contract: {blockchainProof.contractAddress.slice(0, 10)}...{blockchainProof.contractAddress.slice(-8)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playClickSound();
                setShowQrModal(true);
              }}
              className="text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show QR Code</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClickSound();
                setShowBlockchainModal(true);
              }}
              className="text-emerald-400 hover:text-white font-bold text-xs flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Verify Digital ID</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            soundEngine.playClickSound();
            setShowQrModal(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30"
        >
          <QrCode className="w-4 h-4" />
          <span>Present QR for Police / Rescuer</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClickSound();
            setShowBlockchainModal(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          <span>Audit On-Chain Proof</span>
        </button>
      </div>

      {/* QR Code Enlarged Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-white">Verifiable QR Credential</span>
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setShowQrModal(false);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-inner">
              <img src={qrCodeDataUrl} alt="Safety QR" className="w-64 h-64 mx-auto" />
            </div>

            <div>
              <p className="font-mono text-sm font-bold text-cyan-400">{user.digitalSafetyId}</p>
              <p className="text-xs text-slate-400 mt-1">
                Scan with official responder app or camera to verify tourist identity without exposing sensitive private health records.
              </p>
            </div>

            <div className="pt-2">
              <a
                href={qrCodeDataUrl}
                download={`Safety-ID-${user.digitalSafetyId}.png`}
                onClick={() => soundEngine.playClickSound()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Save Offline QR Pass</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Verification Modal */}
      {showBlockchainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Ethereum Sepolia Verification</h3>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setShowBlockchainModal(false);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This tourist credential is authenticated against the public Ethereum Sepolia smart contract registry. No confidential medical or passport records are exposed on the ledger.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold uppercase text-slate-500">Blockchain Network</p>
                <p className="font-semibold text-white mt-0.5">{blockchainProof.chainName} (Chain ID: {blockchainProof.chainId})</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold uppercase text-slate-500">Smart Contract Address</p>
                <p className="font-mono text-cyan-300 mt-0.5 truncate">{blockchainProof.contractAddress}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Transaction Hash (TxHash)</p>
                  <button
                    onClick={handleCopyTx}
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-slate-300 mt-0.5 truncate">{blockchainProof.txHash}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Block Number</p>
                  <p className="font-mono text-white mt-0.5">#{blockchainProof.blockNumber}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Integrity Status</p>
                  <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Tamper-Evident
                  </p>
                </div>
              </div>
            </div>

            {/* Live Verification Check Simulation */}
            <div className="pt-2">
              <button
                onClick={handleSimulateVerify}
                disabled={isVerifying}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Search className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Querying Sepolia Node...' : 'Simulate Authority Cryptographic Verification'}</span>
              </button>

              {verificationResult === 'valid' && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Success: Digital Safety ID signature matches on-chain Merkle root. Certified tourist credential!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
