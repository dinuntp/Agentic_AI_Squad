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
    description: 'Rear-end collision at intersection resulting in bumper and trunk damage. Police report filed at the scene.',
    status: 'Approved',
    dateFiled: '2026-05-10',
    history: [
      { status: 'Submitted', timestamp: '2026-05-10T09:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-12T14:30:00.000Z' },
      { status: 'Approved', timestamp: '2026-05-15T10:15:00.000Z' },
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
    description: 'Emergency room visit due to severe allergic reaction requiring overnight stay and multiple treatments.',
    status: 'Under Review',
    dateFiled: '2026-05-18',
    history: [
      { status: 'Submitted', timestamp: '2026-05-18T11:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-20T09:45:00.000Z' },
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
    description: 'Storm damage to roof and siding of residential property. Multiple areas of water intrusion identified.',
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
    description: 'Life insurance claim filed for policy holder. All required documentation and certificates have been submitted.',
    status: 'Rejected',
    dateFiled: '2026-04-30',
    history: [
      { status: 'Submitted', timestamp: '2026-04-30T10:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-02T13:20:00.000Z' },
      { status: 'Rejected', timestamp: '2026-05-10T16:00:00.000Z' },
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
    description: 'Side-swipe accident in parking garage causing significant door and panel damage on driver side of vehicle.',
    status: 'Submitted',
    dateFiled: '2026-06-01',
    history: [
      { status: 'Submitted', timestamp: '2026-06-01T15:45:00.000Z' },
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
    description: 'Outpatient surgical procedure for knee injury sustained during recreational activities. Physical therapy included.',
    status: 'Under Review',
    dateFiled: '2026-06-05',
    history: [
      { status: 'Submitted', timestamp: '2026-06-05T07:15:00.000Z' },
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

export { STORAGE_KEY, SEEDED_KEY, SEED_DATA, loadClaims, saveClaims };

export default function App() {
  const [claims, setClaims] = useState(() => loadClaims());
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'new-claim' | 'claim-detail'
  const [selectedClaimId, setSelectedClaimId] = useState(null);

  useEffect(() => {
    saveClaims(claims);
  }, [claims]);

  const handleNewClaim = useCallback(() => {
    setView('new-claim');
  }, []);

  const handleViewClaim = useCallback((claimId) => {
    setSelectedClaimId(claimId);
    setView('claim-detail');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSelectedClaimId(null);
    setView('dashboard');
  }, []);

  const handleSubmitClaim = useCallback((newClaim) => {
    setClaims((prev) => [...prev, newClaim]);
    setView('dashboard');
  }, []);

  const handleUpdateClaim = useCallback((updatedClaim) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === updatedClaim.id ? updatedClaim : c))
    );
  }, []);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || null;

  return (
    <>
      <Header onNewClaim={handleNewClaim} showNewClaim={view === 'dashboard'} />
      <main className="main-content">
        {view === 'dashboard' && (
          <div className="view-enter">
            <SummaryCards claims={claims} />
            <ClaimsList claims={claims} onViewClaim={handleViewClaim} />
          </div>
        )}
        {view === 'new-claim' && (
          <div className="view-enter">
            <NewClaimForm
              onSubmit={handleSubmitClaim}
              onCancel={handleBackToDashboard}
              existingIds={claims.map((c) => c.id)}
            />
          </div>
        )}
        {view === 'claim-detail' && selectedClaim && (
          <div className="view-enter">
            <ClaimDetail
              claim={selectedClaim}
              onBack={handleBackToDashboard}
              onUpdateClaim={handleUpdateClaim}
            />
          </div>
        )}
      </main>
    </>
  );
}