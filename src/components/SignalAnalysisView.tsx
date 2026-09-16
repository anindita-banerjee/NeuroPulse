import React, { useState } from 'react';
import {
  Waves,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Patient, EEGPacket, EEGChannelData } from '../types';

interface SignalAnalysisViewProps {
  patient: Patient;
  eegPacket: EEGPacket | null;
}

export const SignalAnalysisView: React.FC<SignalAnalysisViewProps> = ({
  patient,
  eegPacket,
}) => {
  const [selectedElectrode, setSelectedElectrode] = useState<string>('C3');
  const [gain, setGain] = useState<number>(2);
  const [timebase, setTimebase] = useState<string>('5s');
  const [notchFilter, setNotchFilter] = useState<boolean>(true);
  const [bandpass, setBandpass] = useState<string>('0.5-40Hz');

  const channels: EEGChannelData[] = eegPacket?.channels || [];

  // 10-20 Scalp Electrode Map coordinates (normalized 0 to 100 on circular skull)
  const electrodeLayout: { name: string; x: number; y: number; label: string; desc: string }[] = [
    { name: 'Fp1', x: 38, y: 16, label: 'Fp1', desc: 'Left Prefrontal' },
    { name: 'Fp2', x: 62, y: 16, label: 'Fp2', desc: 'Right Prefrontal' },
    { name: 'F3', x: 32, y: 32, label: 'F3', desc: 'Left Frontal (Motor Planning)' },
    { name: 'Fz', x: 50, y: 30, label: 'Fz', desc: 'Midline Frontal' },
    { name: 'F4', x: 68, y: 32, label: 'F4', desc: 'Right Frontal' },
    { name: 'T3', x: 16, y: 50, label: 'T3', desc: 'Left Temporal' },
    { name: 'C3', x: 34, y: 50, label: 'C3', desc: 'Left Motor Cortex (Hand/Arm)' },
    { name: 'Cz', x: 50, y: 50, label: 'Cz', desc: 'Vertex (Sensorimotor / Foot)' },
    { name: 'C4', x: 66, y: 50, label: 'C4', desc: 'Right Motor Cortex (Hand/Arm)' },
    { name: 'T4', x: 84, y: 50, label: 'T4', desc: 'Right Temporal' },
    { name: 'P3', x: 34, y: 68, label: 'P3', desc: 'Left Parietal' },
    { name: 'Pz', x: 50, y: 68, label: 'Pz', desc: 'Midline Parietal (P300 Hub)' },
    { name: 'P4', x: 66, y: 68, label: 'P4', desc: 'Right Parietal' },
    { name: 'O1', x: 38, y: 84, label: 'O1', desc: 'Left Occipital (Visual / SSVEP)' },
    { name: 'Oz', x: 50, y: 86, label: 'Oz', desc: 'Midline Occipital' },
    { name: 'O2', x: 62, y: 84, label: 'O2', desc: 'Right Occipital (Visual / SSVEP)' },
  ];

  const activeChannel = channels.find((c) => c.name === selectedElectrode) || channels[0];

  return (
    <div id="signal-analysis-view" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-semibold">
              MONTAGE ANALYSIS · 16 CHANNELS
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            10–20 Sensorimotor Signal Spectrogram
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated for {patient.name} ({patient.diagnosis}). Real-time biological rhythm decoding and impedance verification.
          </p>
        </div>

        {/* Filter & Acquisition Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Gain:</span>
            {[1, 2, 5].map((g) => (
              <button
                key={g}
                onClick={() => setGain(g)}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  gain === g ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}x
              </button>
            ))}
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Notch:</span>
            <button
              onClick={() => setNotchFilter(!notchFilter)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                notchFilter ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {notchFilter ? '50 Hz ON' : 'OFF'}
            </button>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sweep:</span>
            <span className="font-mono text-blue-400">{timebase}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Scalp Map + Synchronized 16-Channel Waveform Montage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10-20 Head Map & Electrode Inspector (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scalp Map Card */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  ELECTRODE TOPOGRAPHY
                </span>
                <h3 className="text-base font-semibold text-white">10–20 System Map</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                16 Active
              </span>
            </div>

            {/* Visual Head Scalp SVG */}
            <div className="mt-4 relative flex items-center justify-center p-2 bg-[#060a12] rounded-lg border border-slate-800">
              <svg viewBox="0 0 100 100" className="w-64 h-64 select-none">
                {/* Nose indicator */}
                <polygon points="46,6 54,6 50,0" fill="#334155" />
                {/* Ears */}
                <ellipse cx="6" cy="50" rx="3" ry="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <ellipse cx="94" cy="50" rx="3" ry="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />

                {/* Skull perimeter */}
                <circle cx="50" cy="50" r="44" fill="#0d1424" stroke="#1e293b" strokeWidth="2" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="#172554" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="16" fill="none" stroke="#172554" strokeWidth="0.8" strokeDasharray="2,2" />

                {/* Crosshairs */}
                <line x1="50" y1="6" x2="50" y2="94" stroke="#1e293b" strokeWidth="0.8" />
                <line x1="6" y1="50" x2="94" y2="50" stroke="#1e293b" strokeWidth="0.8" />

                {/* Electrodes */}
                {electrodeLayout.map((el) => {
                  const isSelected = selectedElectrode === el.name;
                  const isBCIPrimary = el.name === 'C3' || el.name === 'C4' || el.name === 'Cz' || el.name === 'Pz' || el.name === 'O1';

                  return (
                    <g
                      key={el.name}
                      onClick={() => setSelectedElectrode(el.name)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <circle
                        cx={el.x}
                        cy={el.y}
                        r={isSelected ? 5.5 : 4}
                        fill={
                          isSelected
                            ? '#38bdf8'
                            : isBCIPrimary
                            ? '#2563eb'
                            : '#1e293b'
                        }
                        stroke={isSelected ? '#ffffff' : '#3b82f6'}
                        strokeWidth={isSelected ? 1.5 : 0.8}
                      />
                      <text
                        x={el.x}
                        y={el.y + 1.2}
                        fontSize="3.2"
                        fontWeight="bold"
                        fill={isSelected ? '#000000' : '#ffffff'}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="monospace"
                      >
                        {el.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                Click node to inspect
              </div>
            </div>

            {/* Selected Electrode Details */}
            {activeChannel && (
              <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-blue-400">
                      {activeChannel.name}
                    </span>
                    <span className="text-xs text-slate-300">
                      {activeChannel.region}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    {activeChannel.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400">Electrode Impedance:</span>
                    <div className="font-mono text-white font-semibold">
                      {activeChannel.impedance} kΩ
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Peak Amplitude:</span>
                    <div className="font-mono text-blue-400 font-semibold">
                      ±{activeChannel.amplitude} µV
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded">
                  <Info size={13} className="inline mr-1 text-blue-400" />
                  {activeChannel.name === 'C3' || activeChannel.name === 'C4'
                    ? 'Primary sensorimotor site for motor imagery ERD decoding in paralysis.'
                    : activeChannel.name === 'Pz' || activeChannel.name === 'Cz'
                    ? 'P300 event-related potential hub for assistive matrix spelling.'
                    : activeChannel.name === 'O1' || activeChannel.name === 'O2'
                    ? 'Occipital visual cortex site for SSVEP frequency lock.'
                    : 'Frontal cognitive load & baseline reference channel.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Synchronized 16-Channel Continuous Waveforms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  MULTI-CHANNEL SYNCHRONY
                </span>
                <h3 className="text-base font-semibold text-white">
                  16-Channel Scalp Montage
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Sampling Rate: {patient.samplingRate} Hz · Window: {timebase}
              </div>
            </div>

            {/* Synchronized Channel Stack */}
            <div className="mt-4 space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
              {channels.map((ch, idx) => {
                const isSelected = selectedElectrode === ch.name;
                const points = ch.waveform || [];

                return (
                  <div
                    key={ch.name}
                    onClick={() => setSelectedElectrode(ch.name)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-sm'
                        : 'bg-[#060a12] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {ch.name}
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {ch.region}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-400">{ch.impedance} kΩ</span>
                        <span className="text-blue-400 font-semibold">±{ch.amplitude} µV</span>
                      </div>
                    </div>

                    {/* Channel Waveform Mini-Canvas/SVG */}
                    <div className="h-8 w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${points.length * 10 || 400} 40`}
                        preserveAspectRatio="none"
                        className="w-full h-full"
                      >
                        <path
                          d={
                            points.length > 0
                              ? points
                                  .map((val, pIdx) => {
                                    const x = pIdx * 10;
                                    const y = 20 - (val * (gain * 0.4));
                                    return `${pIdx === 0 ? 'M' : 'L'} ${x} ${Math.max(2, Math.min(38, y))}`;
                                  })
                                  .join(' ')
                              : 'M 0 20 L 400 20'
                          }
                          fill="none"
                          stroke={isSelected ? '#38bdf8' : ch.color || '#3b82f6'}
                          strokeWidth={isSelected ? 1.8 : 1.2}
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
