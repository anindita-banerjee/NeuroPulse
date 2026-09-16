import React, { useState, useEffect } from 'react';
import {
  Command,
  Volume2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  Send,
  Bed,
  Sun,
  Thermometer,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Patient, BCIIntentEvent } from '../types';
import { triggerIntent } from '../api';

interface BCIAssistiveControllerViewProps {
  patient: Patient;
  onRefreshPatient: () => void;
}

export const BCIAssistiveControllerView: React.FC<BCIAssistiveControllerViewProps> = ({
  patient,
  onRefreshPatient,
}) => {
  const [spelledText, setSpelledText] = useState<string>('THANK YOU');
  const [activeFlashedRow, setActiveFlashedRow] = useState<number>(-1);
  const [activeFlashedCol, setActiveFlashedCol] = useState<number>(-1);
  const [isMatrixFlashing, setIsMatrixFlashing] = useState<boolean>(true);
  const [selectedMotorCommand, setSelectedMotorCommand] = useState<string>('Right Hand Grasp');
  const [confidence, setConfidence] = useState<number>(0.92);
  const [recentEvents, setRecentEvents] = useState<BCIIntentEvent[]>([]);
  const [nurseAlertActive, setNurseAlertActive] = useState<boolean>(false);
  const [bedAngle, setBedAngle] = useState<number>(30);
  const [roomLights, setRoomLights] = useState<boolean>(true);

  // 6x6 P300 Matrix Grid
  const matrix: string[][] = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '_'],
  ];

  const quickPhrases = [
    'PLEASE ASSIST',
    'NEED WATER',
    'REPOSITION BED',
    'PAIN IN BACK',
    'CALL FAMILY',
    'THANK YOU',
  ];

  // Matrix flashing simulator for P300 visual evoked potential
  useEffect(() => {
    if (!isMatrixFlashing) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        setActiveFlashedRow(Math.floor(Math.random() * 6));
        setActiveFlashedCol(-1);
      } else {
        setActiveFlashedCol(Math.floor(Math.random() * 6));
        setActiveFlashedRow(-1);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isMatrixFlashing]);

  // Audio Speech Synthesis for paralyzed patient
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger BCI Command and persist to backend
  const handleTriggerCommand = async (commandText: string, category: BCIIntentEvent['category'] = 'speller') => {
    try {
      const newEvent = await triggerIntent(patient.id, {
        intent: commandText,
        category,
        confidence: 0.94,
        eegFeatures: {
          muErdPct: -46,
          betaPeakHz: 20.5,
          p300LatencyMs: 310,
          targetElectrode: category === 'motor_imagery' ? 'C3' : 'Pz',
        },
        executedAction: `Assistive Output Triggered: "${commandText}"`,
      });
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 8)]);
      speakText(commandText);
      onRefreshPatient();
    } catch (err) {
      console.error('Failed to trigger BCI command:', err);
    }
  };

  const handleSelectChar = (char: string) => {
    const nextText = char === '_' ? spelledText + ' ' : spelledText + char;
    setSpelledText(nextText);
  };

  const triggerNurseEmergency = async () => {
    setNurseAlertActive(true);
    await handleTriggerCommand('EMERGENCY: ICU Nurse Assistance Needed', 'assistive_alert');
    setTimeout(() => setNurseAlertActive(false), 8000);
  };

  return (
    <div id="bci-assistive-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              BCI ASSISTIVE INTERFACE · PARALYSIS CONTROL
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            P300 Neuro-Speller & Motor Imagery Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct brainwave communication and assistive environmental controls for {patient.name} ({patient.diagnosis}).
          </p>
        </div>

        {/* Emergency Beacon */}
        <button
          id="btn-nurse-call-large"
          onClick={triggerNurseEmergency}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
            nurseAlertActive
              ? 'bg-rose-600 text-white animate-bounce ring-4 ring-rose-500/50'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
          }`}
        >
          <AlertTriangle size={18} className="text-rose-400" />
          <span>{nurseAlertActive ? 'NURSE BEACON DISPATCHED!' : 'EMERGENCY NURSE BEACON'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: P300 Matrix Speller (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  EVOKED POTENTIAL COMMUNICATOR
                </span>
                <h3 className="text-base font-semibold text-white">
                  P300 6×6 Visual Matrix Speller
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMatrixFlashing(!isMatrixFlashing)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    isMatrixFlashing
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isMatrixFlashing ? 'Matrix Active' : 'Paused'}
                </button>
              </div>
            </div>

            {/* Current Spelled Text Buffer */}
            <div className="mt-4 p-4 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div className="flex-1 mr-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Brainwave Message Buffer:
                </div>
                <div className="text-xl font-bold font-mono text-white tracking-widest mt-0.5 min-h-[28px]">
                  {spelledText || <span className="text-slate-600">Focus on letter...</span>}
                  <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1 align-middle" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakText(spelledText)}
                  className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  title="Speech Synthesizer TTS Speak"
                >
                  <Volume2 size={16} />
                </button>
                <button
                  onClick={() => handleTriggerCommand(spelledText, 'speller')}
                  className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  title="Send & Execute Intention"
                >
                  <Send size={16} />
                </button>
                <button
                  onClick={() => setSpelledText('')}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Clear Buffer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Matrix Grid 6x6 */}
            <div className="mt-4 grid grid-cols-6 gap-2 p-3 bg-[#060a12] rounded-xl border border-slate-800 select-none">
              {matrix.map((row, rIdx) =>
                row.map((char, cIdx) => {
                  const isFlashed =
                    isMatrixFlashing && (activeFlashedRow === rIdx || activeFlashedCol === cIdx);

                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleSelectChar(char)}
                      className={`h-12 rounded-lg font-mono text-base font-bold transition-all flex items-center justify-center ${
                        isFlashed
                          ? 'bg-white text-slate-950 scale-105 shadow-lg shadow-white/40 ring-2 ring-blue-400'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 hover:bg-blue-600/30 hover:border-blue-500'
                      }`}
                    >
                      {char}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Phrase Selection Cards */}
            <div className="mt-4">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">
                Rapid Clinical Assistive Tiles:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickPhrases.map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => {
                      setSpelledText(phrase);
                      handleTriggerCommand(phrase, 'speller');
                    }}
                    className="p-2 rounded-lg bg-slate-950/70 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 text-left text-xs font-medium text-slate-200 transition-colors truncate"
                  >
                    • {phrase}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Motor Imagery & Environmental Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Motor Imagery Intent Classifier */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                KINEMATIC NEURO-FEEDBACK
              </span>
              <h3 className="text-base font-semibold text-white">Motor Imagery Classifier</h3>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Decodes event-related desynchronization (ERD) over C3/C4 sensorimotor cortex during mental movement rehearsal.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { label: 'Right Hand Grasp (C3 ERD)', desc: 'Robotic hand exoskeleton close', erd: '-54%' },
                { label: 'Left Hand Grasp (C4 ERD)', desc: 'Robotic hand exoskeleton close', erd: '-48%' },
                { label: 'Both Feet Motor Imagery', desc: 'Assistive wheelchair forward roll', erd: '-38%' },
                { label: 'Tongue/Swallow Intention', desc: 'Nurse call / drink request', erd: '-42%' },
                { label: 'Resting Baseline State', desc: 'Neurofeedback balance state', erd: '0%' },
              ].map((cmd) => {
                const isSelected = selectedMotorCommand === cmd.label;
                return (
                  <div
                    key={cmd.label}
                    onClick={() => {
                      setSelectedMotorCommand(cmd.label);
                      handleTriggerCommand(cmd.label, 'motor_imagery');
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{cmd.label}</div>
                      <div className="text-[10px] text-slate-400">{cmd.desc}</div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {cmd.erd}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bedside Environmental IoT Controls */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                SMART ROOM AUTOMATION
              </span>
              <h3 className="text-base font-semibold text-white">Bedside Environmental Controls</h3>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Bed Incline */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Bed size={15} className="text-blue-400" />
                    Hospital Bed Incline Angle
                  </span>
                  <span className="font-mono text-white font-bold">{bedAngle}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBedAngle(Math.max(0, bedAngle - 10))}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  >
                    -10°
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    value={bedAngle}
                    onChange={(e) => setBedAngle(Number(e.target.value))}
                    aria-label="Hospital Bed Incline Angle"
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <button
                    onClick={() => setBedAngle(Math.min(75, bedAngle + 10))}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  >
                    +10°
                  </button>
                </div>
              </div>

              {/* Room Lighting */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sun size={15} className="text-amber-400" />
                  ICU Room Lights (Eye Comfort)
                </span>
                <button
                  onClick={() => setRoomLights(!roomLights)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    roomLights ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {roomLights ? 'ON (65%)' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
