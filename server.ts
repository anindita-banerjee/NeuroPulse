import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { generateClinicalAssessment } from './server/gemini';
import { EEGPacket, EEGChannelData } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'NeuroPulse EEG-BCI Clinical Server',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
  });
});

// 2. Patients endpoints
app.get('/api/patients', (req, res) => {
  try {
    const patients = db.getPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
});

app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve patient' });
  }
});

app.post('/api/patients', (req, res) => {
  try {
    const newPatient = req.body;
    if (!newPatient.name || !newPatient.diagnosis) {
      return res.status(400).json({ error: 'Name and diagnosis are required' });
    }
    const created = db.createPatient({
      ...newPatient,
      id: newPatient.id || `NP-${Math.floor(100 + Math.random() * 900)}`,
      daysInProgram: newPatient.daysInProgram || 1,
      status: newPatient.status || 'stable',
      signalQuality: newPatient.signalQuality || 92,
      activeChannelCount: 16,
      samplingRate: 256,
      motorImageryAccuracy: newPatient.motorImageryAccuracy || 85.0,
      bandPowers: newPatient.bandPowers || { alpha: 30, beta: 25, theta: 25, delta: 20, mu: 25 },
      eegConfig: newPatient.eegConfig || {
        baselineAlpha: 30,
        baselineBeta: 25,
        baselineTheta: 25,
        baselineDelta: 20,
        muSuppressionThreshold: 0.45,
        filterNotch: true,
        filterBandpass: '0.5 - 40 Hz',
        impedanceCheck: { Cz: 2.1, C3: 2.0, C4: 2.2 },
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

app.put('/api/patients/:id', (req, res) => {
  try {
    const updated = db.updatePatient(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// 3. Doctor's Prescriptions endpoints
app.get('/api/patients/:id/prescriptions', (req, res) => {
  try {
    const prescriptions = db.getPrescriptions(req.params.id);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve prescriptions' });
  }
});

app.post('/api/patients/:id/prescriptions', (req, res) => {
  try {
    const patient = db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const prescriptionData = req.body;
    const newRx = db.createPrescription({
      ...prescriptionData,
      id: `RX-${patient.id}-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      datePrescribed: prescriptionData.datePrescribed || new Date().toISOString().split('T')[0],
      signatureHash: `eeg-sha256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      status: 'active',
    });

    res.status(201).json(newRx);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add prescription' });
  }
});

app.put('/api/prescriptions/:id', (req, res) => {
  try {
    const updated = db.updatePrescription(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// 4. Session History endpoints
app.get('/api/patients/:id/history', (req, res) => {
  try {
    const histories = db.getHistories(req.params.id);
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session history' });
  }
});

app.post('/api/patients/:id/history', (req, res) => {
  try {
    const patient = db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const historyData = req.body;
    const existingHistories = db.getHistories(patient.id);
    const nextSessionNum = existingHistories.length > 0
      ? Math.max(...existingHistories.map((h) => h.sessionNumber)) + 1
      : 1;

    const newHistory = db.createHistory({
      ...historyData,
      id: `HIST-${patient.id}-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      sessionNumber: historyData.sessionNumber || nextSessionNum,
      date: historyData.date || new Date().toISOString().split('T')[0],
      time: historyData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      prescribedProtocolAdherence: historyData.prescribedProtocolAdherence || 100,
    });

    // Also update patient recent scores
    db.updatePatient(patient.id, {
      motorImageryAccuracy: historyData.bciAccuracy || patient.motorImageryAccuracy,
      attentionScore: historyData.focusScore || patient.attentionScore,
      fatigueScore: historyData.fatigueIndex || patient.fatigueScore,
    });

    res.status(201).json(newHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add session history log' });
  }
});

// 5. BCI Intention & Assistive Control endpoints
app.get('/api/patients/:id/intents', (req, res) => {
  try {
    const intents = db.getIntents(req.params.id);
    res.json(intents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve intent events' });
  }
});

app.post('/api/patients/:id/intents', (req, res) => {
  try {
    const patient = db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const intentData = req.body;
    const newIntent = db.createIntent({
      ...intentData,
      id: `EVT-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      timestamp: new Date().toLocaleTimeString(),
      status: 'executed',
    });

    // Update patient current intent
    db.updatePatient(patient.id, {
      currentIntent: {
        command: newIntent.intent,
        confidence: newIntent.confidence,
        timestamp: 'Just now',
        channelTrigger: newIntent.eegFeatures?.targetElectrode || 'Cz',
      },
    });

    res.status(201).json(newIntent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record BCI intent event' });
  }
});

// 5b. Clinical Appointment Bookings endpoints (Persistent database)
app.get('/api/bookings', (req, res) => {
  try {
    const { userId, userEmail, patientId } = req.query;
    const bookings = db.getBookings({
      userId: typeof userId === 'string' ? userId : undefined,
      userEmail: typeof userEmail === 'string' ? userEmail : undefined,
      patientId: typeof patientId === 'string' ? patientId : undefined,
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

app.get('/api/bookings/:id', (req, res) => {
  try {
    const booking = db.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const data = req.body;
    if (!data.appointmentDate || !data.appointmentTime || !data.patientName) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }
    const bookingId = data.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullBooking = {
      ...data,
      id: bookingId,
      createdAt: data.createdAt || new Date().toISOString(),
      status: data.status || 'confirmed',
    };
    const created = db.createBooking(fullBooking);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/api/bookings/:id', (req, res) => {
  try {
    const updated = db.updateBooking(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  try {
    const success = db.deleteBooking(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// 6. Real-time EEG packet simulation tailored to each patient
app.get('/api/patients/:id/eeg-live', (req, res) => {
  try {
    const patient = db.getPatientById(req.params.id) || db.getPatients()[0];
    const t = Date.now() / 1000;

    // Standard 10-20 system 16-channel montage
    const channelNames = [
      { name: 'Fp1', region: 'Prefrontal Left' },
      { name: 'Fp2', region: 'Prefrontal Right' },
      { name: 'F3', region: 'Frontal Left' },
      { name: 'F4', region: 'Frontal Right' },
      { name: 'C3', region: 'Motor Cortex (Right Hand Area)' },
      { name: 'C4', region: 'Motor Cortex (Left Hand Area)' },
      { name: 'P3', region: 'Parietal Left' },
      { name: 'P4', region: 'Parietal Right' },
      { name: 'O1', region: 'Occipital Left' },
      { name: 'O2', region: 'Occipital Right' },
      { name: 'T3', region: 'Temporal Left' },
      { name: 'T4', region: 'Temporal Right' },
      { name: 'Fz', region: 'Frontal Midline' },
      { name: 'Cz', region: 'Central Vertex (Sensorimotor)' },
      { name: 'Pz', region: 'Parietal Midline (P300 Hub)' },
      { name: 'Oz', region: 'Occipital Midline (Visual)' },
    ];

    const channelColors = [
      '#3b82f6', '#60a5fa', '#06b6d4', '#22d3ee',
      '#10b981', '#34d399', '#8b5cf6', '#a78bfa',
      '#ec4899', '#f472b6', '#f59e0b', '#fbbf24',
      '#6366f1', '#14b8a6', '#f97316', '#84cc16'
    ];

    // Build realistic biological oscillations parameterized by patient diagnosis
    const channels: EEGChannelData[] = channelNames.map((ch, idx) => {
      const waveformPoints: number[] = [];
      const numSamples = 40;

      // Base patient frequency characteristics
      let baseFreq = 10.0; // Alpha
      let amp = 24;

      if (patient.id === 'NP-101') {
        // ALS: High Alpha + P300 potential spike at Pz/Cz
        baseFreq = 10.2;
        amp = (ch.name === 'Pz' || ch.name === 'Cz') ? 38 : 22;
      } else if (patient.id === 'NP-102') {
        // SCI C5: Strong Beta/Mu suppression in C3/C4
        baseFreq = (ch.name === 'C3' || ch.name === 'C4') ? 11.5 : 18.0;
        amp = (ch.name === 'C3' || ch.name === 'C4') ? 34 : 26;
      } else if (patient.id === 'NP-103') {
        // Stroke: High Theta slow-wave in C3/F3, beta in C4
        baseFreq = (ch.name === 'C3' || ch.name === 'F3') ? 6.2 : 12.0;
        amp = (ch.name === 'C3' || ch.name === 'F3') ? 42 : 20;
      } else if (patient.id === 'NP-104') {
        // GBS: Occipital SSVEP 12/15 Hz harmonic resonance
        baseFreq = (ch.name === 'O1' || ch.name === 'O2' || ch.name === 'Oz') ? 12.0 : 9.5;
        amp = (ch.name.startsWith('O')) ? 44 : 18;
      }

      for (let s = 0; s < numSamples; s++) {
        const timeOffset = t + (s / 100);
        const signal =
          amp * Math.sin(2 * Math.PI * baseFreq * timeOffset * 0.15 + idx * 0.4) +
          (amp * 0.35) * Math.sin(2 * Math.PI * (baseFreq * 2.1) * timeOffset * 0.15) +
          (amp * 0.18) * Math.sin(2 * Math.PI * 4.5 * timeOffset * 0.15) +
          (Math.random() - 0.5) * 5; // realistic microvolt baseline noise
        waveformPoints.push(Math.round(signal * 10) / 10);
      }

      const impedance = patient.eegConfig?.impedanceCheck?.[ch.name] || (1.5 + (idx % 3) * 0.6);

      return {
        name: ch.name,
        region: ch.region,
        color: channelColors[idx % channelColors.length],
        amplitude: Math.abs(Math.round(waveformPoints[waveformPoints.length - 1] * 10) / 10),
        impedance,
        status: impedance > 5.0 ? 'high_impedance' : impedance > 3.0 ? 'acceptable' : 'optimal',
        waveform: waveformPoints,
      };
    });

    // FFT Spectrum (0 to 45 Hz)
    const fftSpectrum = Array.from({ length: 45 }, (_, i) => {
      const freq = i + 1;
      let power = 5 + 3 * Math.sin(freq * 0.3);
      if (freq >= 8 && freq <= 13) {
        power += (patient.bandPowers.alpha * 1.8) * Math.exp(-Math.pow(freq - 10, 2) / 4);
      } else if (freq >= 14 && freq <= 30) {
        power += (patient.bandPowers.beta * 0.8) * Math.exp(-Math.pow(freq - 20, 2) / 20);
      } else if (freq >= 4 && freq <= 7) {
        power += (patient.bandPowers.theta * 1.2) * Math.exp(-Math.pow(freq - 6, 2) / 3);
      } else if (freq < 4) {
        power += (patient.bandPowers.delta * 0.9);
      }
      return { freq, power: Math.max(2, Math.round(power)) };
    });

    // Pattern warnings tailored to patient status
    const patternWarnings: EEGPacket['patternWarnings'] = [
      {
        type: 'normal',
        title: 'EEG Baseline Coherence Active',
        description: `Signal synchronized across ${patient.activeChannelCount} electrodes with ${patient.dominantWave} band dominance.`,
        timestamp: 'Real-time',
      },
      {
        type: patient.fatigueScore > 35 ? 'warning' : 'normal',
        title: patient.fatigueScore > 35 ? 'Cognitive Fatigue Trend Detected' : 'Cognitive Load Balanced',
        description: patient.fatigueScore > 35
          ? `Theta/Alpha power ratio elevated. Recommended rest interval in ${Math.max(5, 45 - patient.fatigueScore)} min.`
          : 'Patient attention and focus within therapeutic training window.',
        timestamp: '1 min ago',
      },
      {
        type: 'normal',
        title: 'Assistive BCI Gateway Online',
        description: `Channel montage verified for ${patient.bciParadigm}. Ready for intentional command decoding.`,
        timestamp: 'Active',
      }
    ];

    const packet: EEGPacket = {
      timestamp: Date.now(),
      patientId: patient.id,
      channels,
      fftSpectrum,
      bandPowers: patient.bandPowers,
      signalQuality: patient.signalQuality,
      noiseLevel: 2.3,
      patternWarnings,
    };

    res.json(packet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate EEG packet' });
  }
});

// 7. Server-side AI clinical analysis
app.post('/api/ai/clinical-analysis', async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    const patient = db.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const prescriptions = db.getPrescriptions(patientId);
    const histories = db.getHistories(patientId);

    const report = await generateClinicalAssessment(patient, prescriptions, histories);
    res.json({
      patientId,
      patientName: patient.name,
      assessment: report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI assessment error:', error);
    res.status(500).json({ error: 'Failed to generate clinical assessment' });
  }
});

// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeuroPulse EEG-BCI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
