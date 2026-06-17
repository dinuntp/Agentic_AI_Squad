import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ClaimsList from './components/ClaimsList.jsx';
import NewClaimForm from './components/NewClaimForm.jsx';
import ClaimDetail from './components/ClaimDetail.jsx';

const STORAGE_KEY = 'insurance_claims_data';
const SEEDED_KEY = 'insurance_claims_seeded';

const SEED_DATA = [
  {
    id: 'CLM-1001',
    claimantName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-0101',
    type: 'Auto',
    incidentDate: '2026-05-10',
    amount: 4200,
    description: 'Rear-end collision at intersection causing significant bumper and trunk damage to my sedan.',
    status: 'Approved',
    dateFiled: '2026-05-10',
    history: [
      { status: 'Submitted', timestamp: '2026-05-10T09:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-12T14:30:00.000Z' },
      { status: 'Approved', timestamp: '2026-05-15T10:00:00.000Z' },
    ],
  },
  {
    id: 'CLM-1002',
    claimantName: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '555-0102',
    type: 'Health',
    incidentDate: '2026-05-18',
    amount: 12800,
    description: 'Emergency room visit and subsequent surgery for appendicitis requiring three day hospital stay.',
    status: 'Under Review',
    dateFiled: '2026-05-18',
    history: [
      { status: 'Submitted', timestamp: '2026-05-18T11:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-20T09:15:00.000Z' },
    ],
  },
  {
    id: 'CLM-1003',
    claimantName: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '555-0103',
    type: 'Property',
    incidentDate: '2026-05-25',
    amount: 31500,
    description: 'Severe storm damage to roof and siding of primary residence requiring full replacement of roofing materials.',
    status: 'Submitted',
    dateFiled: '2026-05-25',
    history: [
      { status: 'Submitted', timestamp: '2026-05-25T08:30:00.000Z' },
    ],
  },
  {
    id: 'CLM-1004',
    claimantName: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '555-0104',
    type: 'Life',
    incidentDate: '2026-04-30',
    amount: 150000,
    description: 'Life insurance claim filed for policyholder benefit payout following documented qualifying event.',
    status: 'Rejected',
    dateFiled: '2026-04-30',
    history: [
      { status: 'Submitted', timestamp: '2026-04-30T10:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-02T13:00:00.000Z' },
      { status: 'Rejected', timestamp: '2026-05-08T16:45:00.000Z' },
    ],
  },
  {
    id: 'CLM-1005',
    claimantName: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '555-0105',
    type: 'Auto',
    incidentDate: '2026-06-01',
    amount: 7600,
    description: 'Side-impact collision in parking lot resulting in driver-side door and panel damage to vehicle.',
    status: 'Submitted',
    dateFiled: '2026-06-01',
    history: [
      { status: 'Submitted', timestamp: '2026-06-01T14:20:00.000Z' },
    ],
  },
  {
    id: 'CLM-1006',
    claimantName: 'Robert Kim',
    email: 'robert.kim@email.com',
    phone: '555-0106',
    type: 'Health',
    incidentDate: '2026-06-05',
    amount: 3400,
    description: 'Outpatient diagnostic imaging and specialist consultation for persistent lower back injury.',
    status: 'Under Review',
    dateFiled: '2026-06-05',
    history: [
      { status: 'Submitted', timestamp: '2026-06-05T09:45:00.000Z' },
      { status: 'Under Review', timestamp: '2026-06-07T11:30:00.000Z' },
    ],
  },
];

function loadClaims() {
  const seeded = localStorage.getItem(SEEDED_KEY);
  if (!seeded) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    localStorage.setItem(SEEDED_KEY, 'true');
    return SEED_DATA;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveClaims(claims) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

export default function App() {
  const [claims, setClaims] = useState(() => loadClaims());
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState(null);

  useEffect(() => {
    saveClaims(claims);
  }, [claims]);

  const handleNewClaim = useCallback(() => {
    setActiveView('new-claim');
  }, []);

  const handleViewClaim = useCallback((claimId) => {
    setSelectedClaimId(claimId);
    setActiveView('claim-detail');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSelectedClaimId(null);
    setActiveView('dashboard');
  }, []);

  const handleSubmitClaim = useCallback((newClaim) => {
    setClaims((prev) => [...prev, newClaim]);
    setActiveView('dashboard');
  }, []);

  const handleUpdateClaim = useCallback((updatedClaim) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === updatedClaim.id ? updatedClaim : c))
    );
  }, []);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || null;

  return (
    <div className="app">
      <Header onNewClaim={handleNewClaim} />
      <main className="main-content">
        {activeView === 'dashboard' && (
          <>
            <SummaryCards claims={claims} />
            <ClaimsList claims={claims} onViewClaim={handleViewClaim} />
          </>
        )}
        {activeView === 'new-claim' && (
          <NewClaimForm
            onSubmit={handleSubmitClaim}
            onCancel={handleBackToDashboard}
            existingIds={claims.map((c) => c.id)}
          />
        )}
        {activeView === 'claim-detail' && selectedClaim && (
          <ClaimDetail
            claim={selectedClaim}
            onBack={handleBackToDashboard}
            onUpdateClaim={handleUpdateClaim}
          />
        )}
      </main>
    </div>
  );
}

export { STORAGE_KEY, SEEDED_KEY, SEED_DATA, loadClaims, saveClaims };