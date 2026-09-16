import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SignalAnalysisView } from './components/SignalAnalysisView';
import { PatientMonitorView } from './components/PatientMonitorView';
import { DoctorPrescriptionView } from './components/DoctorPrescriptionView';
import { HistorySessionView } from './components/HistorySessionView';
import { BCIAssistiveControllerView } from './components/BCIAssistiveControllerView';
import { ResearchInsightsView } from './components/ResearchInsightsView';
import { AppointmentsView } from './components/AppointmentsView';
import { AdminPortalView } from './components/AdminPortalView';
import { AppointmentBookingModal } from './components/AppointmentBookingModal';
import { AuthModal } from './components/AuthModal';
import { NewPrescriptionModal } from './components/NewPrescriptionModal';
import { NewSessionModal } from './components/NewSessionModal';
import { NewPatientModal } from './components/NewPatientModal';
import { ClinicalReportModal } from './components/ClinicalReportModal';

import {
  Patient,
  DoctorPrescription,
  SessionHistory,
  EEGPacket,
  AppointmentBooking
} from './types';
import {
  fetchPatients,
  fetchPatientById,
  fetchPatientPrescriptions,
  fetchPatientHistory,
  fetchLiveEEG,
} from './api';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('Live Telemetry');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [eegPacket, setEegPacket] = useState<EEGPacket | null>(null);
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [histories, setHistories] = useState<SessionHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Modals state
  const [isNewRxOpen, setIsNewRxOpen] = useState<boolean>(false);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState<boolean>(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [nurseAlertMessage, setNurseAlertMessage] = useState<string | null>(null);

  // Load initial patients
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const data = await fetchPatients();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch initial patients:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // When selectedPatient changes, load prescriptions and histories
  useEffect(() => {
    if (!selectedPatient) return;

    let isMounted = true;
    async function loadPatientData() {
      try {
        const [rxData, histData] = await Promise.all([
          fetchPatientPrescriptions(selectedPatient!.id),
          fetchPatientHistory(selectedPatient!.id),
        ]);
        if (isMounted) {
          setPrescriptions(rxData);
          setHistories(histData);
        }
      } catch (err) {
        console.error('Failed to load patient prescriptions/histories:', err);
      }
    }

    loadPatientData();
    return () => {
      isMounted = false;
    };
  }, [selectedPatient?.id]);

  // Real-time EEG streaming loop
  useEffect(() => {
    if (!isStreaming || !selectedPatient) return;

    let intervalId: any;
    const fetchStream = async () => {
      try {
        const packet = await fetchLiveEEG(selectedPatient.id);
        setEegPacket(packet);
      } catch (err) {
        console.warn('EEG live stream fetch error:', err);
      }
    };

    fetchStream();
    intervalId = setInterval(fetchStream, 120);

    return () => clearInterval(intervalId);
  }, [isStreaming, selectedPatient?.id]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleRefreshCurrentPatient = async () => {
    if (!selectedPatient) return;
    try {
      const refreshed = await fetchPatientById(selectedPatient.id);
      setSelectedPatient(refreshed);
      setPatients((prev) => prev.map((p) => (p.id === refreshed.id ? refreshed : p)));
    } catch (err) {
      console.error('Failed to refresh patient:', err);
    }
  };

  const handlePrescriptionAdded = (newRx: DoctorPrescription) => {
    setPrescriptions((prev) => [newRx, ...prev]);
  };

  const handleSessionAdded = (newHist: SessionHistory) => {
    setHistories((prev) => [newHist, ...prev]);
  };

  const handlePatientAdded = (newP: Patient) => {
    setPatients((prev) => [...prev, newP]);
    setSelectedPatient(newP);
  };

  const triggerNurseBeacon = () => {
    if (!selectedPatient) return;
    const msg = `Emergency ICU Nurse Call Beacon triggered for ${selectedPatient.name} (Room ${selectedPatient.roomBed})`;
    setNurseAlertMessage(msg);
    setTimeout(() => {
      setNurseAlertMessage(null);
    }, 6000);
  };

  if (isLoading || !selectedPatient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b14] text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto animate-pulse">
            <span className="font-mono text-xl font-bold">NP</span>
          </div>
          <div className="text-sm font-semibold tracking-wide">Initializing NeuroPulse EEG-BCI Core...</div>
          <div className="text-xs text-slate-400 font-mono">Connecting to Firebase & patient montages</div>
        </div>
      </div>
    );
  }

  return (
    <div id="neuropulse-app" className="flex h-screen w-screen overflow-hidden bg-[#070b14] text-slate-200">
      {/* Nurse Beacon Alert Toast */}
      {nurseAlertMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-rose-500 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 border border-rose-400">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
          <div className="text-xs font-semibold">{nurseAlertMessage}</div>
          <button
            onClick={() => setNurseAlertMessage(null)}
            className="ml-2 text-white/80 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
        onOpenBookingModal={() => setIsBookingOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={handleSelectPatient}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming(!isStreaming)}
          onEmergencyAlert={triggerNurseBeacon}
          onExportReport={() => setIsReportOpen(true)}
          onOpenBookingModal={() => setIsBookingOpen(true)}
          onNavigateTab={setActiveTab}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === 'Live Telemetry' && (
              <DashboardView
                patient={selectedPatient}
                eegPacket={eegPacket}
                onNavigateTab={setActiveTab}
                onOpenNewPrescription={() => {
                  setActiveTab('Doctor Prescriptions');
                  setIsNewRxOpen(true);
                }}
                onOpenNewSession={() => {
                  setActiveTab('History & Analytics');
                  setIsNewSessionOpen(true);
                }}
                onSimulateSignal={() => {
                  setIsStreaming((prev) => !prev);
                }}
                onUploadEDF={() => {
                  setIsBookingOpen(true);
                }}
              />
            )}

            {activeTab === 'Appointments & Bookings' && (
              <AppointmentsView
                patients={patients}
                selectedPatient={selectedPatient}
                onOpenBookingModal={() => setIsBookingOpen(true)}
                onSelectPatient={handleSelectPatient}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'Admin Portal' && (
              <AdminPortalView
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={handleSelectPatient}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'Signal Analysis' && (
              <SignalAnalysisView
                patient={selectedPatient}
                eegPacket={eegPacket}
              />
            )}

            {activeTab === 'Patient Monitor' && (
              <PatientMonitorView
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={handleSelectPatient}
                onNavigateTab={setActiveTab}
                onOpenNewPatientModal={() => setIsNewPatientOpen(true)}
              />
            )}

            {activeTab === 'Doctor Prescriptions' && (
              <DoctorPrescriptionView
                patient={selectedPatient}
                prescriptions={prescriptions}
                onOpenNewPrescription={() => setIsNewRxOpen(true)}
              />
            )}

            {activeTab === 'History & Analytics' && (
              <HistorySessionView
                patient={selectedPatient}
                histories={histories}
                onOpenNewSession={() => setIsNewSessionOpen(true)}
                onExportReport={() => setIsReportOpen(true)}
              />
            )}

            {activeTab === 'BCI Speller & Assistive' && (
              <BCIAssistiveControllerView
                patient={selectedPatient}
                onRefreshPatient={handleRefreshCurrentPatient}
              />
            )}

            {activeTab === 'Research Insights' && (
              <ResearchInsightsView
                patient={selectedPatient}
                prescriptions={prescriptions}
                histories={histories}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        patients={patients}
        selectedPatient={selectedPatient}
        onBookingSuccess={(booking: AppointmentBooking) => {
          setActiveTab('Appointments & Bookings');
        }}
      />

      <AuthModal />

      <NewPrescriptionModal
        patient={selectedPatient}
        isOpen={isNewRxOpen}
        onClose={() => setIsNewRxOpen(false)}
        onSuccess={handlePrescriptionAdded}
      />

      <NewSessionModal
        patient={selectedPatient}
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        onSuccess={handleSessionAdded}
      />

      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSuccess={handlePatientAdded}
      />

      <ClinicalReportModal
        patient={selectedPatient}
        prescription={prescriptions[0] || null}
        histories={histories}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
