import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ClaimsList from './components/ClaimsList.jsx';
import NewClaimForm from './components/NewClaimForm.jsx';
import ClaimDetail from './components/ClaimDetail.jsx';

const STORAGE_KEY = 'insuranceClaims';

const SEED_DATA = [
  {
    id: 'CLM-1001',
    claimantName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-0101',
    type: 'Auto',
    incidentDate: '2026-05-10',
    dateFiled: '2026-05-10',
    amount: 4200,
    description: 'Rear-end collision on Highway 101 resulting in bumper and trunk damage.',
    status: 'Approved',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-05-10T09:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-12T14:30:00.000Z' },
      { status: 'Approved', timestamp: '2026-05-15T11:00:00.000Z' },
    ],
  },
  {
    id: 'CLM-1002',
    claimantName: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '555-0102',
    type: 'Health',
    incidentDate: '2026-05-18',
    dateFiled: '2026-05-18',
    amount: 12800,
    description: 'Emergency room visit and subsequent hospitalization for cardiac evaluation and treatment.',
    status: 'Under Review',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-05-18T10:00:00.000Z' },
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
    dateFiled: '2026-05-25',
    amount: 31500,
    description: 'Severe storm damage to roof and siding requiring full replacement and structural repair.',
    status: 'Submitted',
    statusHistory: [
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
    dateFiled: '2026-04-30',
    amount: 150000,
    description: 'Life insurance benefit claim following policyholder passing due to natural causes on April 30th.',
    status: 'Rejected',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-04-30T11:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-02T10:00:00.000Z' },
      { status: 'Rejected', timestamp: '2026-05-10T16:45:00.000Z' },
    ],
  },
  {
    id: 'CLM-1005',
    claimantName: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '555-0105',
    type: 'Auto',
    incidentDate: '2026-06-01',
    dateFiled: '2026-06-01',
    amount: 7600,
    description: 'Side-impact collision at intersection resulting in door panel and frame damage to vehicle.',
    status: 'Submitted',
    statusHistory: [
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
    dateFiled: '2026-06-05',
    amount: 3400,
    description: 'Outpatient surgical procedure for knee arthroscopy and post-operative rehabilitation costs.',
    status: 'Under Review',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-06-05T09:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-06-07T11:30:00.000Z' },
    ],
  },
];

function App() {
  const [claims, setClaims] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const isInitialized = useRef(false);

  // Mount: read from localStorage or seed
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClaims(parsed);
          isInitialized.current = true;
          return;
        }
      } catch (e) {
        // Invalid JSON — fall through to seed
      }
    }
    // No valid data in localStorage — seed
    setClaims(SEED_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    isInitialized.current = true;
  }, []);

  // Sync claims to localStorage whenever they change (after initialization)
  useEffect(() => {
    if (isInitialized.current && claims.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    }
  }, [claims]);

  const handleNavigate = (view, claimId = null) => {
    setCurrentView(view);
    setSelectedClaimId(claimId);
  };

  const handleAddClaim = (claimData) => {
    const maxNum = claims.reduce((max, c) => {
      const num = parseInt(c.id.replace('CLM-', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newId = `CLM-${maxNum + 1}`;

    const newClaim = {
      id: newId,
      ...claimData,
      dateFiled: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      statusHistory: [
        { status: 'Submitted', timestamp: new Date().toISOString() },
      ],
    };
    setClaims((prev) => [...prev, newClaim]);
    setCurrentView('dashboard');
  };

  const handleStatusChange = (claimId, newStatus) => {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim;
        return {
          ...claim,
          status: newStatus,
          statusHistory: [
            ...claim.statusHistory,
            { status: newStatus, timestamp: new Date().toISOString() },
          ],
        };
      })
    );
  };

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} />
      {currentView === 'dashboard' && (
        <>
          <SummaryCards claims={claims} />
          <ClaimsList claims={claims} onNavigate={handleNavigate} />
        </>
      )}
      {currentView === 'new-claim' && (
        <NewClaimForm onAddClaim={handleAddClaim} onNavigate={handleNavigate} />
      )}
      {currentView === 'claim-detail' && (
        <ClaimDetail
          claim={claims.find((c) => c.id === selectedClaimId)}
          onNavigate={handleNavigate}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default App;