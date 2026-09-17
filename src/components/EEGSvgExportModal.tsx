import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  Check,
  CheckCircle2,
  ZoomIn,
  Smartphone,
  Monitor,
  Eye,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { Patient, EEGChannelData, EEGPacket } from '../types';
import { generateEEGSvgReport, downloadEEGSvgReport } from '../utils/eegSvgExport';

interface EEGSvgExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  channel: EEGChannelData;
  eegPacket: EEGPacket | null;
  isFiltered: boolean;
}

export const EEGSvgExportModal: React.FC<EEGSvgExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  channel,
  eegPacket,
  isFiltered,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const svgContent = generateEEGSvgReport({
    patient,
    channel,
    eegPacket,
    isFiltered,
  });

  const handleDownload = () => {
    downloadEEGSvgReport({
      patient,
      channel,
      eegPacket,
      isFiltered,
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(svgContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Export EEG Telemetry Report (.SVG)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Vector Resolution
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patients can save and recheck their brainwave signals on any device (phone, tablet, computer)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Information & Preview */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <Smartphone size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Universal Device Support</span>
                <span className="text-slate-400 text-[11px]">
                  SVG files open immediately in iOS Safari, Android Chrome, and all desktop browsers.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <ZoomIn size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Infinite Vector Zoom</span>
                <span className="text-slate-400 text-[11px]">
                  No pixelation. Zoom directly into individual microvolts (µV) and 12-second wave intervals.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Clinical Parameters Included</span>
                <span className="text-slate-400 text-[11px]">
                  Montage {channel.name}, impedance, filter bandwidth (0.5–40 Hz), and FFT band powers.
                </span>
              </div>
            </div>
          </div>

          {/* SVG Visual Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={13} className="text-blue-400" />
                <span>Vector Report Preview ({channel.name} · {patient.name})</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                1040 × 780 Scalable Vector Graphics
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#050811] p-3 overflow-hidden shadow-inner flex items-center justify-center">
              <div
                className="w-full max-h-[340px] overflow-hidden rounded-lg flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          </div>

          {/* Patient Recheck Instructions */}
          <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-start gap-3">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-blue-300">How to recheck on your personal device: </strong>
              Click <strong>"Download .SVG File"</strong> below. Once downloaded, double-click the file to open it in your browser (Google Chrome, Apple Safari, Microsoft Edge), or send it via email to view on your smartphone. You can zoom in and out using pinch-to-zoom to inspect waveform details.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopySvg}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors"
          >
            {copiedCode ? <Check size={14} className="text-emerald-400" /> : <FileCode size={14} />}
            <span>{copiedCode ? 'SVG Code Copied!' : 'Copy Raw SVG Code'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>

            <button
              id="btn-confirm-svg-download"
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {downloadSuccess ? (
                <>
                  <Check size={16} className="text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download .SVG File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
