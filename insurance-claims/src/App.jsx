import React, { useState, useEffect } from 'react';
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
    description: 'Rear-end collision at intersection of Main St and Oak Ave. Other driver ran a red light. Damage to rear bumper and trunk.',
    status: 'Approved',
    history: [
      { status: 'Submitted', timestamp: '2026-05-10T09:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-12T14:30:00.000Z' },
      { status: 'Approved', timestamp: '2026-05-15T11:00:00.000Z' }
    ]
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
    description: 'Emergency room visit and subsequent surgery for appendicitis. Hospitalized for three days at City General Hospital.',
    status: 'Under Review',
    history: [
      { status: 'Submitted', timestamp: '2026-05-18T10:15:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-20T09:45:00.000Z' }
    ]
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
    description: 'Severe storm damage to roof and siding of residential property. Several windows broken and basement flooding occurred.',
    status: 'Submitted',
    history: [
      { status: 'Submitted', timestamp: '2026-05-25T16:00:00.000Z' }
    ]
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
    description: 'Life insurance claim filed on behalf of policyholder estate. Documentation includes death certificate and policy documents.',
    status: 'Rejected',
    history: [
      { status: 'Submitted', timestamp: '2026-04-30T08:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-02T10:00:00.000Z' },
      { status: 'Rejected', timestamp: '2026-05-10T15:30:00.000Z' }
    ]
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
    description: 'Side-impact collision in parking garage. Driver side door and front fender damaged. Police report filed at scene.',
    status: 'Submitted',
    history: [
      { status: 'Submitted', timestamp: '2026-06-01T11:30:00.000Z' }
    ]
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
    description: 'Outpatient knee surgery and physical therapy sessions following sports injury. Includes MRI and specialist consultations.',
    status: 'Under Review',
    history: [
      { status: 'Submitted', timestamp: '2026-06-05T13:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-06-07T10:20:00.000Z' }
    ]
  }
];

function App() {
  const [claims, setClaims] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // If localStorage is corrupted, fall through to seed data
    }
    const seed = JSON.parse(JSON.stringify(SEED_DATA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync claims to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  }, [claims]);

  // --- Navigation Handler ---
  const handleNavigate = (view, claimId) => {
    setActiveView(view);
    if (claimId !== undefined) {
      setSelectedClaimId(claimId);
    } else if (view !== 'claimDetail') {
      setSelectedClaimId(null);
    }
  };

  // --- Add New Claim ---
  const handleAddClaim = (claimData) => {
    const maxNum = claims.reduce((max, c) => {
      const num = parseInt(c.id.split('-')[1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 1000);

    const nextId = 'CLM-' + (maxNum + 1);
    const today = new Date().toISOString().split('T')[0];

    const newClaim = {
      id: nextId,
      claimantName: claimData.claimantName,
      email: claimData.email,
      phone: claimData.phone,
      type: claimData.type,
      incidentDate: claimData.incidentDate,
      dateFiled: today,
      amount: claimData.amount,
      description: claimData.description,
      status: 'Submitted',
      history: [
        { status: 'Submitted', timestamp: new Date().toISOString() }
      ]
    };

    setClaims((prev) => [...prev, newClaim]);
    handleNavigate('dashboard');
  };

  // --- Status Change ---
  const handleStatusChange = (claimId, newStatus) => {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim;
        return {
          ...claim,
          status: newStatus,
          history: [
            ...claim.history,
            { status: newStatus, timestamp: new Date().toISOString() }
          ]
        };
      })
    );
  };

  // --- Filter + Search (AND logic) ---
  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === 'All' || claim.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      claim.claimantName.toLowerCase().includes(query) ||
      claim.id.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // --- Summary Statistics ---
  const summaryStats = claims.reduce(
    (acc, claim) => {
      acc.total += 1;
      if (claim.status === 'Submitted' || claim.status === 'Under Review') {
        acc.pendingReview += 1;
      }
      if (claim.status === 'Approved') {
        acc.approved += 1;
        acc.approvedAmount += claim.amount;
      }
      if (claim.status === 'Rejected') {
        acc.rejected += 1;
      }
      return acc;
    },
    { total: 0, pendingReview: 0, approved: 0, approvedAmount: 0, rejected: 0 }
  );

  // --- Selected Claim for Detail View ---
  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || null;

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} />
      <div className="main-content">
        {activeView === 'dashboard' && (
          <>
            <SummaryCards stats={summaryStats} />
            <ClaimsList
              claims={filteredClaims}
              filterStatus={filterStatus}
              searchQuery={searchQuery}
              onFilterChange={setFilterStatus}
              onSearchChange={setSearchQuery}
              onSelectClaim={(id) => handleNavigate('claimDetail', id)}
            />
          </>
        )}

        {activeView === 'newClaim' && (
          <NewClaimForm
            onSubmit={handleAddClaim}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {activeView === 'claimDetail' && (
          <ClaimDetail
            claim={selectedClaim}
            onStatusChange={handleStatusChange}
            onBack={() => handleNavigate('dashboard')}
          />
        )}
      </div>
    </div>
  );
}

export default App;