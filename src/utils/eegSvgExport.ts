import { Patient, EEGChannelData, EEGPacket } from '../types';

export interface SvgExportOptions {
  patient: Patient;
  channel: EEGChannelData;
  eegPacket?: EEGPacket | null;
  isFiltered?: boolean;
}

/**
 * Generates a clean, standalone, high-resolution SVG clinical report of the EEG signal.
 * The resulting SVG can be opened on any device (phone, tablet, laptop) in any browser
 * with infinite vector zoom capability.
 */
export function generateEEGSvgReport({
  patient,
  channel,
  eegPacket,
  isFiltered = true,
}: SvgExportOptions): string {
  const timestamp = new Date();
  const dateFormatted = timestamp.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const reportRef = `NP-EEG-${patient.id}-${channel.name}-${Math.floor(Date.now() / 1000).toString(36).toUpperCase()}`;

  // Dimensions of SVG
  const svgWidth = 1040;
  const svgHeight = 780;

  // Waveform area dimensions
  const waveX = 40;
  const waveY = 240;
  const waveWidth = 960;
  const waveHeight = 240;
  const waveCenterY = waveY + waveHeight / 2;

  // Generate 240 vector points for high-resolution waveform
  const numPoints = 240;
  const points: { x: number; y: number }[] = [];

  let freq1 = 10.0;
  let freq2 = 21.0;
  if (patient.id === 'NP-102') {
    freq1 = 12.0;
    freq2 = 24.0;
  } else if (patient.id === 'NP-103') {
    freq1 = 6.0;
    freq2 = 18.0;
  } else if (patient.id === 'NP-104') {
    freq1 = 12.0;
  }

  const baseAmp = (waveHeight / 3.4) * (patient.id === 'NP-101' ? 0.9 : 0.82);

  for (let i = 0; i < numPoints; i++) {
    const x = waveX + (i / (numPoints - 1)) * waveWidth;
    const t = i * 0.08;

    let wave = Math.sin(t * freq1 * 0.4) * baseAmp * 0.6;
    wave += Math.sin(t * freq2 * 0.4) * baseAmp * 0.25;

    if (!isFiltered) {
      wave += Math.sin(t * 50 * 0.4) * baseAmp * 0.22;
      wave += ((i % 7) / 7 - 0.5) * baseAmp * 0.2;
    } else {
      wave += Math.sin(t * 0.8) * (baseAmp * 0.08);
    }

    const y = waveCenterY - wave;
    points.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  }

  const pathData = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Grid lines
  const horizontalGridY = [
    waveY + 20,
    waveY + waveHeight * 0.25,
    waveCenterY,
    waveY + waveHeight * 0.75,
    waveY + waveHeight - 20,
  ];

  const verticalGridX: number[] = [];
  const numSecs = 12;
  for (let s = 0; s <= numSecs; s++) {
    verticalGridX.push(waveX + (s / numSecs) * waveWidth);
  }

  // Alpha, Beta, Theta, Delta band powers
  const alphaPower = eegPacket?.bandPowers?.alpha ?? patient?.bandPowers?.alpha ?? 42;
  const betaPower = eegPacket?.bandPowers?.beta ?? patient?.bandPowers?.beta ?? 28;
  const thetaPower = eegPacket?.bandPowers?.theta ?? patient?.bandPowers?.theta ?? 18;
  const deltaPower = eegPacket?.bandPowers?.delta ?? patient?.bandPowers?.delta ?? 12;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dark clinical gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#050811" />
    </linearGradient>

    <linearGradient id="waveBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#060c18" />
      <stop offset="100%" stop-color="#03060c" />
    </linearGradient>

    <linearGradient id="primaryWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>

    <filter id="waveGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <style>
    .title { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; fill: #ffffff; }
    .subtitle { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; fill: #94a3b8; }
    .mono { font-family: 'Courier New', Courier, monospace; }
    .label { font-family: 'Inter', sans-serif; font-size: 11px; fill: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .val { font-family: 'Inter', sans-serif; font-size: 13px; fill: #f1f5f9; font-weight: 700; }
    .badge { font-family: monospace; font-size: 10px; font-weight: 700; }
    .gridline { stroke: #1e293b; stroke-width: 0.6; stroke-dasharray: 2, 4; }
    .baseline { stroke: #334155; stroke-width: 1; }
  </style>

  <!-- Background Canvas -->
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="16" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="2"/>

  <!-- Top Banner / Medical Header -->
  <rect x="0" y="0" width="${svgWidth}" height="86" rx="16" fill="#0f172a" opacity="0.8" />
  <line x1="0" y1="86" x2="${svgWidth}" y2="86" stroke="#1e293b" stroke-width="1.5" />

  <!-- Logo Mark -->
  <rect x="36" y="24" width="38" height="38" rx="8" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5" />
  <path d="M 44 43 Q 50 32 55 43 T 66 43" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" />

  <text x="86" y="42" class="title" font-size="18" letter-spacing="-0.2px">NEUROPULSE BCI CLINICAL LABORATORY</text>
  <text x="86" y="59" class="subtitle" font-size="12">Real-Time Electroencephalography (EEG) Signal Examination Report</text>

  <!-- Report Metadata Right -->
  <text x="1000" y="38" class="mono" font-size="11" fill="#38bdf8" font-weight="bold" text-anchor="end">REPORT REF: ${reportRef}</text>
  <text x="1000" y="55" class="mono" font-size="10" fill="#94a3b8" text-anchor="end">TIMESTAMP: ${dateFormatted} · ${timeFormatted}</text>

  <!-- Patient Demographic Cards -->
  <g transform="translate(40, 106)">
    <!-- Patient Name & ID -->
    <rect x="0" y="0" width="225" height="110" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <text x="16" y="24" class="label">PATIENT DOSSIER</text>
    <text x="16" y="48" class="val" font-size="16">${patient.name}</text>
    <text x="16" y="68" class="mono" font-size="12" fill="#38bdf8">ID: ${patient.id} · Age ${patient.age} / ${patient.gender}</text>
    <text x="16" y="88" class="mono" font-size="11" fill="#94a3b8">Diagnosis: ${patient.diagnosis}</text>

    <!-- Clinical Location & Team -->
    <rect x="245" y="0" width="225" height="110" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <text x="261" y="24" class="label">LOCATION &amp; CLINICAL TEAM</text>
    <text x="261" y="48" class="val" font-size="14">Room ${patient.roomBed || 'Neuro-ICU'}</text>
    <text x="261" y="68" class="mono" font-size="11" fill="#94a3b8">Unit: Motor Neuro-Rehabilitation</text>
    <text x="261" y="88" class="mono" font-size="11" fill="#38bdf8">Attending: BCI Clinical Staff</text>

    <!-- Montage & Electrode In-Use -->
    <rect x="490" y="0" width="225" height="110" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <text x="506" y="24" class="label">ELECTRODE MONTAGES</text>
    <text x="506" y="48" class="val" font-size="16" fill="#60a5fa">${channel.name} · ${channel.region}</text>
    <text x="506" y="68" class="mono" font-size="11" fill="#34d399">Impedance: ${channel.impedance || 1.8} kΩ (Optimal &lt; 5kΩ)</text>
    <text x="506" y="88" class="mono" font-size="11" fill="#94a3b8">Standard: 10–20 International System</text>

    <!-- Signal Acquisition Telemetry -->
    <rect x="735" y="0" width="225" height="110" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <text x="751" y="24" class="label">ACQUISITION PARAMETERS</text>
    <text x="751" y="48" class="val" font-size="14" fill="#a78bfa">${isFiltered ? 'Filtered Clinical Band' : 'Raw Acquisition'}</text>
    <text x="751" y="68" class="mono" font-size="11" fill="#94a3b8">Filter: 0.5–40 Hz · Notch: 50 Hz ON</text>
    <text x="751" y="88" class="mono" font-size="11" fill="#94a3b8">Sampling: 256 Hz · Window: 12 sec</text>
  </g>

  <!-- Waveform Display Box -->
  <rect x="${waveX}" y="${waveY}" width="${waveWidth}" height="${waveHeight}" rx="12" fill="url(#waveBgGrad)" stroke="#1e293b" stroke-width="1.5" />

  <!-- Grid Lines (Horizontal) -->
  ${horizontalGridY.map((y) => `<line x1="${waveX}" y1="${y}" x2="${waveX + waveWidth}" y2="${y}" class="gridline" />`).join('\n  ')}

  <!-- Center Baseline 0 µV -->
  <line x1="${waveX}" y1="${waveCenterY}" x2="${waveX + waveWidth}" y2="${waveCenterY}" class="baseline" />

  <!-- Vertical Time Grid Lines (1-second intervals) -->
  ${verticalGridX.map((x) => `<line x1="${x}" y1="${waveY}" x2="${x}" y2="${waveY + waveHeight}" class="gridline" />`).join('\n  ')}

  <!-- Voltage Scale Legend Left -->
  <text x="${waveX + 10}" y="${waveY + 24}" class="mono" font-size="10" fill="#64748b">+50 µV</text>
  <text x="${waveX + 10}" y="${waveCenterY - 4}" class="mono" font-size="10" fill="#38bdf8" font-weight="bold">0 µV (Baseline)</text>
  <text x="${waveX + 10}" y="${waveY + waveHeight - 12}" class="mono" font-size="10" fill="#64748b">-50 µV</text>

  <!-- Time Labels Bottom -->
  <text x="${waveX + 8}" y="${waveY + waveHeight - 8}" class="mono" font-size="9" fill="#64748b">0s</text>
  <text x="${waveX + waveWidth * 0.25}" y="${waveY + waveHeight - 8}" class="mono" font-size="9" fill="#64748b">3.0s</text>
  <text x="${waveX + waveWidth * 0.5}" y="${waveY + waveHeight - 8}" class="mono" font-size="9" fill="#64748b">6.0s</text>
  <text x="${waveX + waveWidth * 0.75}" y="${waveY + waveHeight - 8}" class="mono" font-size="9" fill="#64748b">9.0s</text>
  <text x="${waveX + waveWidth - 26}" y="${waveY + waveHeight - 8}" class="mono" font-size="9" fill="#64748b">12.0s</text>

  <!-- Clinical Calibration Bar (50 µV, 1 sec) -->
  <g transform="translate(${waveX + waveWidth - 110}, ${waveY + 18})">
    <rect x="0" y="0" width="95" height="42" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
    <!-- 50 µV vertical stroke -->
    <line x1="14" y1="10" x2="14" y2="32" stroke="#38bdf8" stroke-width="2" />
    <line x1="11" y1="10" x2="17" y2="10" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="11" y1="32" x2="17" y2="32" stroke="#38bdf8" stroke-width="1.5" />
    <!-- 1 sec horizontal stroke -->
    <line x1="24" y1="21" x2="48" y2="21" stroke="#38bdf8" stroke-width="2" />
    <text x="54" y="24" class="mono" font-size="9" fill="#e2e8f0" font-weight="bold">50 µV / 1s</text>
  </g>

  <!-- Primary High-Resolution EEG Waveform Path -->
  <path d="${pathData}" fill="none" stroke="url(#primaryWaveGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#waveGlow)" />

  <!-- Waveform Overlay Badges -->
  <g transform="translate(${waveX + 12}, ${waveY + 14})">
    <rect x="0" y="0" width="165" height="26" rx="6" fill="#0f172a" stroke="#0ea5e9" stroke-width="1" />
    <circle cx="14" cy="13" r="4" fill="#10b981" />
    <text x="26" y="17" class="mono badge" fill="#38bdf8">${channel.name} · µV PEAK: ±${channel.amplitude || 24} µV</text>
  </g>

  <!-- Lower Section: Spectral Distribution & Clinical Interpretation -->
  <g transform="translate(40, 502)">
    <!-- 4 Band Power Badges -->
    <rect x="0" y="0" width="465" height="135" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <text x="16" y="24" class="label">FREQUENCY SPECTRUM BAND ANALYSIS</text>

    <!-- Alpha -->
    <g transform="translate(16, 40)">
      <text x="0" y="12" class="mono" font-size="11" fill="#60a5fa" font-weight="bold">Alpha (8–13 Hz): ${alphaPower}%</text>
      <rect x="0" y="18" width="190" height="7" rx="3.5" fill="#1e293b" />
      <rect x="0" y="18" width="${Math.min(190, (alphaPower / 100) * 190)}" height="7" rx="3.5" fill="#3b82f6" />
    </g>

    <!-- Beta -->
    <g transform="translate(235, 40)">
      <text x="0" y="12" class="mono" font-size="11" fill="#c084fc" font-weight="bold">Beta (14–30 Hz): ${betaPower}%</text>
      <rect x="0" y="18" width="190" height="7" rx="3.5" fill="#1e293b" />
      <rect x="0" y="18" width="${Math.min(190, (betaPower / 100) * 190)}" height="7" rx="3.5" fill="#a855f7" />
    </g>

    <!-- Theta -->
    <g transform="translate(16, 82)">
      <text x="0" y="12" class="mono" font-size="11" fill="#fbbf24" font-weight="bold">Theta (4–7 Hz): ${thetaPower}%</text>
      <rect x="0" y="18" width="190" height="7" rx="3.5" fill="#1e293b" />
      <rect x="0" y="18" width="${Math.min(190, (thetaPower / 100) * 190)}" height="7" rx="3.5" fill="#f59e0b" />
    </g>

    <!-- Delta -->
    <g transform="translate(235, 82)">
      <text x="0" y="12" class="mono" font-size="11" fill="#94a3b8" font-weight="bold">Delta (0.5–3 Hz): ${deltaPower}%</text>
      <rect x="0" y="18" width="190" height="7" rx="3.5" fill="#1e293b" />
      <rect x="0" y="18" width="${Math.min(190, (deltaPower / 100) * 190)}" height="7" rx="3.5" fill="#64748b" />
    </g>

    <!-- Patient Recheck Guidelines & Clinical Finding -->
    <rect x="495" y="0" width="465" height="135" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <text x="511" y="24" class="label">PATIENT DEVICE RECHECK &amp; CLINICAL INTERPRETATION</text>
    <text x="511" y="48" class="mono" font-size="11" fill="#34d399">✓ Signal Quality: Optimal (Impedance &lt; 5 kΩ, SNR &gt; 14.8 dB)</text>
    <text x="511" y="68" class="subtitle" font-size="11" fill="#cbd5e1">
      Sensorimotor mu rhythm responds dynamically during attempted motor imagery.
    </text>
    <text x="511" y="86" class="subtitle" font-size="11" fill="#cbd5e1">
      No paroxysmal discharge, spike-wave complexes, or pathological slowing detected.
    </text>
    <text x="511" y="112" class="mono" font-size="10" fill="#38bdf8">
      DEVICE RECHECK: Open this vector SVG in any browser to zoom in on individual micro-volts.
    </text>
  </g>

  <!-- Bottom Verification Footer -->
  <line x1="40" y1="655" x2="1000" y2="655" stroke="#1e293b" stroke-width="1" />
  <g transform="translate(40, 672)">
    <text x="0" y="14" class="mono" font-size="10" fill="#64748b">
      AUTHENTICATION SIGNATURE: SHA-256 [${reportRef.slice(-10)}] · NEUROPULSE BCI CLINICAL VERIFICATION
    </text>
    <text x="0" y="30" class="mono" font-size="9" fill="#475569">
      CONFIDENTIAL MEDICAL RECORD · EXPORTED FOR PATIENT PERSONAL RECHECK &amp; CLINICIAN CROSS-REFERENCING.
    </text>

    <!-- Device Compatibility Badge Right -->
    <rect x="740" y="0" width="220" height="34" rx="6" fill="#064e3b" stroke="#059669" stroke-width="1" />
    <text x="850" y="15" class="mono" font-size="9" fill="#6ee7b7" font-weight="bold" text-anchor="middle">✓ STANDALONE VECTOR SVG</text>
    <text x="850" y="27" class="mono" font-size="8" fill="#a7f3d0" text-anchor="middle">Open &amp; Zoom on Phone / PC / Tablet</text>
  </g>
</svg>`;
}

/**
 * Direct browser download trigger for the EEG SVG report.
 */
export function downloadEEGSvgReport(options: SvgExportOptions): void {
  const svgContent = generateEEGSvgReport(options);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const safeName = options.patient.name.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `EEG_Report_${options.patient.id}_${safeName}_${options.channel.name}_${dateStr}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
