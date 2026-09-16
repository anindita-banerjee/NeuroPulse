import React, { useState, useEffect, useRef } from 'react';
import {
  Waves,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Clock,
  Filter,
  Layers,
  ArrowUpRight,
  FilePlus,
  Play,
  Pause
} from 'lucide-react';
import { Patient, EEGPacket, EEGChannelData } from '../types';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  patient: Patient;
  eegPacket: EEGPacket | null;
  onNavigateTab: (tab: NavTab) => void;
  onOpenNewPrescription: () => void;
  onOpenNewSession: () => void;
  onSimulateSignal: () => void;
  onUploadEDF: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patient,
  eegPacket,
  onNavigateTab,
  onOpenNewPrescription,
  onOpenNewSession,
  onSimulateSignal,
  onUploadEDF,
}) => {
  const [selectedChannelIdx, setSelectedChannelIdx] = useState<number>(4); // default C3 (Motor cortex)
  const [isFiltered, setIsFiltered] = useState<boolean>(true);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const channels: EEGChannelData[] = eegPacket?.channels || [];
  const currentChannel = channels[selectedChannelIdx] || channels[0] || {
    name: 'C3',
    region: 'Motor Cortex',
    amplitude: 24,
    waveform: [],
    impedance: 1.8,
    status: 'optimal',
  };

  // Continuous live oscilloscope animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      const stepX = 40;
      const stepY = 25;

      for (let x = 0; x < width; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center baseline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw continuous real-time EEG waveform
      const points = 200;
      const centerY = height / 2;
      const baseAmp = (height / 4) * (patient.id === 'NP-101' ? 0.9 : 0.8);

      ctx.beginPath();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = isFiltered ? '#38bdf8' : '#818cf8';

      // Patient-specific frequency signature
      let freq1 = 10.0; // Hz
      let freq2 = 21.0; // Beta
      if (patient.id === 'NP-102') {
        freq1 = 12.0;
        freq2 = 24.0;
      } else if (patient.id === 'NP-103') {
        freq1 = 6.0; // Theta slow-wave
        freq2 = 18.0;
      } else if (patient.id === 'NP-104') {
        freq1 = 12.0;
      }

      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * width;
        const t = (i + offset) * 0.05;

        // Wave synthesis with physiological harmonics & notch filter effect
        let wave = Math.sin(t * freq1 * 0.4) * baseAmp * 0.6;
        wave += Math.sin(t * freq2 * 0.4) * baseAmp * 0.25;

        if (!isFiltered) {
          // Add 50/60 Hz powerline hum and high-frequency muscle noise
          wave += Math.sin(t * 50 * 0.4) * baseAmp * 0.22;
          wave += (Math.random() - 0.5) * baseAmp * 0.2;
        } else {
          // Cleaned clinical wave with minor baseline wander
          wave += Math.sin(t * 0.8) * (baseAmp * 0.08);
        }

        const y = centerY + wave;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Lead cursor point
      ctx.fillStyle = isFiltered ? '#38bdf8' : '#818cf8';
      ctx.beginPath();
      ctx.arc(width - 2, centerY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (isLiveActive) {
        offset += 1.2;
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isFiltered, isLiveActive, patient.id, selectedChannelIdx]);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              LIVE SESSION · #{patient.id}
            </span>
            <span className="text-xs text-slate-400">· Room {patient.roomBed}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Good morning, Dr. Chen
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time brain signal monitoring, prescription protocol & rehabilitation telemetry for <span className="text-slate-200 font-medium">{patient.name}</span> ({patient.diagnosis}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-upload-edf"
            onClick={onUploadEDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Upload size={14} className="text-slate-400" />
            <span>Upload EEG file</span>
          </button>

          <button
            id="btn-generate-signal"
            onClick={onSimulateSignal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className="text-blue-400" />
            <span>Generate signal</span>
          </button>

          <button
            id="btn-quick-new-rx"
            onClick={onOpenNewPrescription}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors shadow-sm"
          >
            <FilePlus size={14} className="text-emerald-400" />
            <span>New Prescription</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">EEG channels</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">16</div>
            <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              All channels active
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Signal quality</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {patient.signalQuality}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Impedance &lt; 2.5 kΩ</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Dominant wave</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {patient.dominantWave}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {patient.dominantWave === 'Alpha'
                ? '8–13 Hz detected'
                : patient.dominantWave === 'Beta'
                ? '13–30 Hz active'
                : '4–8 Hz synchronized'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Waves size={20} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Alert status</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">Normal</div>
            <div className="text-[11px] text-slate-400 mt-1">No critical patterns</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Real-Time Monitoring & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-time Oscilloscope & Frequency Domain */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Oscilloscope Card */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  REAL-TIME MONITORING
                </span>
                <h3 className="text-base font-semibold text-white">Live EEG signal</h3>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Channel dropdown */}
                <div className="relative">
                  <select
                    id="select-oscilloscope-channel"
                    value={selectedChannelIdx}
                    onChange={(e) => setSelectedChannelIdx(Number(e.target.value))}
                    aria-label="Select EEG Channel for Oscilloscope"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {channels.map((ch, idx) => (
                      <option key={ch.name} value={idx}>
                        Channel {idx + 1 < 10 ? `0${idx + 1}` : idx + 1} ({ch.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter toggle */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setIsFiltered(false)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      !isFiltered ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setIsFiltered(true)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      isFiltered ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Filtered
                  </button>
                </div>

                {/* Live toggle */}
                <button
                  onClick={() => setIsLiveActive(!isLiveActive)}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    isLiveActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title={isLiveActive ? 'Pause wave' : 'Play wave'}
                >
                  {isLiveActive ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </div>
            </div>

            {/* Oscilloscope Canvas */}
            <div className="mt-4 relative bg-[#060a12] rounded-lg border border-slate-800 overflow-hidden">
              <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  {currentChannel.name} · {currentChannel.region}
                </span>
              </div>

              <div className="absolute top-2.5 right-3 z-10 text-right">
                <div className="text-[11px] font-mono text-blue-400 font-semibold">
                  ±{currentChannel.amplitude || 24} µV
                </div>
                <div className="text-[9px] font-mono text-slate-400">Window: 12 sec</div>
              </div>

              <canvas
                ref={canvasRef}
                width={700}
                height={220}
                className="w-full h-56 block cursor-crosshair"
              />

              <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>Notch: 50 Hz ON</span>
                <span>·</span>
                <span>Bandpass: 0.5–40 Hz</span>
                <span>·</span>
                <span className="text-emerald-400">Receiving telemetry</span>
              </div>
            </div>
          </div>

          {/* Frequency Domain FFT Spectrum */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  FREQUENCY DOMAIN
                </span>
                <h3 className="text-base font-semibold text-white">FFT spectrum</h3>
              </div>
              <div className="text-xs text-slate-400 font-mono">0 – 45 Hz Frequency Range</div>
            </div>

            <div className="mt-4 h-40 flex items-end gap-1 px-1 bg-[#060a12] p-3 rounded-lg border border-slate-800">
              {(eegPacket?.fftSpectrum || []).slice(0, 35).map((point) => {
                const heightPct = Math.min(100, Math.max(8, point.power * 2.2));
                const isAlpha = point.freq >= 8 && point.freq <= 13;
                const isBeta = point.freq >= 14 && point.freq <= 30;
                const isTheta = point.freq >= 4 && point.freq <= 7;

                return (
                  <div
                    key={point.freq}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        isAlpha
                          ? 'bg-blue-500 group-hover:bg-blue-400 shadow-sm shadow-blue-500/20'
                          : isBeta
                          ? 'bg-purple-500 group-hover:bg-purple-400'
                          : isTheta
                          ? 'bg-amber-500 group-hover:bg-amber-400'
                          : 'bg-slate-700 group-hover:bg-slate-600'
                      }`}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-7 hidden group-hover:flex items-center bg-slate-800 text-[9px] font-mono text-white px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap z-20">
                      {point.freq}Hz: {point.power}µV²
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
              <span>0.5 Hz (Delta)</span>
              <span className="text-amber-400">4-8 Hz (Theta)</span>
              <span className="text-blue-400 font-semibold">8-13 Hz (Alpha peak)</span>
              <span className="text-purple-400">14-30 Hz (Beta)</span>
              <span>45 Hz</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Band Powers, Patient Profile & Pattern Detection */}
        <div className="space-y-6">
          {/* Signal Composition Band Powers */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  SIGNAL COMPOSITION
                </span>
                <h3 className="text-base font-semibold text-white">Band powers</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Last 30 sec</span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Alpha */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Alpha (8–13 Hz)
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {patient.bandPowers.alpha}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${patient.bandPowers.alpha}%` }}
                  />
                </div>
              </div>

              {/* Beta */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Beta (13–30 Hz)
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {patient.bandPowers.beta}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${patient.bandPowers.beta}%` }}
                  />
                </div>
              </div>

              {/* Theta */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Theta (4–8 Hz)
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {patient.bandPowers.theta}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${patient.bandPowers.theta}%` }}
                  />
                </div>
              </div>

              {/* Delta */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Delta (0.5–4 Hz)
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {patient.bandPowers.delta}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${patient.bandPowers.delta}%` }}
                  />
                </div>
              </div>

              {/* Mu Rhythm for BCI Motor Imagery */}
              <div className="pt-1 border-t border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Mu Rhythm (BCI Motor ERD)
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {patient.bandPowers.mu}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${patient.bandPowers.mu}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Patient Quick Monitor Card */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  PATIENT MONITORING
                </span>
                <h3 className="text-base font-semibold text-white">{patient.name}</h3>
              </div>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                  patient.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {patient.status}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-xs font-medium text-slate-200">{patient.diagnosis}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{patient.paralysisType}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Day {patient.daysInProgram} · Session started 09:42 AM
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[10px] text-slate-400">Attention</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {patient.attentionScore}%
                </div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[10px] text-slate-400">Focus score</div>
                <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
                  {patient.focusScore}%
                </div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[10px] text-slate-400">Fatigue</div>
                <div
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    patient.fatigueScore > 35 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {patient.fatigueScore}%
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('Patient Monitor')}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
            >
              <span>View full clinical profile</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Pattern Detection Early Warning System */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                PATTERN DETECTION
              </span>
              <h3 className="text-base font-semibold text-white">Early warning system</h3>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Pattern 1 */}
              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Normal brain activity</div>
                    <div className="text-[10px] text-slate-400">Baseline activity within expected range</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  Clear
                </span>
              </div>

              {/* Pattern 2 */}
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Elevated stress / fatigue trend</div>
                    <div className="text-[10px] text-slate-400">Monitor beta activity · 2 min ago</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Review
                </span>
              </div>

              {/* Pattern 3 */}
              <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">BCI Assistive Gateway Active</div>
                    <div className="text-[10px] text-slate-400">Accuracy at {patient.motorImageryAccuracy}%</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  Optimal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Insights Banner at Bottom */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">
              RESEARCH INSIGHTS
            </span>
            <div className="text-sm font-semibold text-white mt-0.5">
              Alpha dominance is trending upward
            </div>
            <p className="text-xs text-slate-400">
              Signal coherence improved 12% across the last 3 sessions for {patient.name}. Motor imagery latency reduced by 45ms.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('Research Insights')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors shrink-0 shadow-sm"
        >
          <span>View research insights</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
};
