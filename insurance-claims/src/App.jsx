import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ClaimsList from './components/ClaimsList.jsx';
import NewClaimForm from './components/NewClaimForm.jsx';
import ClaimDetail from './components/ClaimDetail.jsx';

const STORAGE_KEY = 'insurance_claims';
const SEEDED_KEY = 'insurance_claims_seeded';

function getSeedData() {
  return [
    {
      id: 'CLM-1001',
      claimantName: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '555-0101',
      type: 'Auto',
      incidentDate: '2026-05-10',
      dateFiled: '2026-05-10',
      amount: 4200,
      description:
        'Rear-end collision at intersection on Highway 101. Vehicle sustained significant bumper and trunk damage requiring full replacement.',
      status: 'Approved',
      statusHistory: [
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
      dateFiled: '2026-05-18',
      amount: 12800,
      description:
        'Emergency room visit following severe allergic reaction. Includes ambulance transport, IV treatment, and overnight observation stay.',
      status: 'Under Review',
      statusHistory: [
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
      dateFiled: '2026-05-25',
      amount: 31500,
      description:
        'Storm damage to residential property including roof shingles torn off, broken windows on second floor, and water damage to interior walls and flooring.',
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
      description:
        'Life insurance benefit claim following the passing of the policyholder. All required documentation including death certificate and policy documents have been submitted.',
      status: 'Rejected',
      statusHistory: [
        { status: 'Submitted', timestamp: '2026-04-30T10:00:00.000Z' },
        { status: 'Under Review', timestamp: '2026-05-02T13:00:00.000Z' },
        { status: 'Rejected', timestamp: '2026-05-05T16:20:00.000Z' },
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
      description:
        'Side-impact collision at a four-way stop. Driver side door and front fender damaged. Airbags deployed. Minor injuries treated at urgent care.',
      status: 'Submitted',
      statusHistory: [
        { status: 'Submitted', timestamp: '2026-06-01T12:00:00.000Z' },
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
      description:
        'Outpatient knee surgery for torn meniscus repair. Includes pre-operative consultation, arthroscopic procedure, and post-operative physical therapy sessions.',
      status: 'Under Review',
      statusHistory: [
        { status: 'Submitted', timestamp: '2026-06-05T07:15:00.000Z' },
        { status: 'Under Review', timestamp: '2026-06-07T11:30:00.000Z' },
      ],
    },
  ];
}

function loadClaims() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load claims from localStorage:', e);
  }
  return [];
}

function generateClaimId(claims) {
  if (claims.length === 0) {
    return 'CLM-1001';
  }
  const nums = claims.map((c) => {
    const parts = c.id.split('-');
    return parseInt(parts[1], 10);
  });
  const maxNum = Math.max(...nums);
  return `CLM-${maxNum + 1}`;
}

function App() {
  const [claims, setClaims] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize: seed data on first load, then load from localStorage
  useEffect(() => {
    const isSeeded = localStorage.getItem(SEEDED_KEY);
    if (!isSeeded) {
      const seedData = getSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      localStorage.setItem(SEEDED_KEY, 'true');
      setClaims(seedData);
    } else {
      setClaims(loadClaims());
    }
  }, []);

  // Helper: save claims to both state and localStorage
  function saveClaims(updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setClaims(updated);
  }

  // Navigation handler
  function handleNavigate(view, claimId) {
    setCurrentView(view);
    if (claimId !== undefined) {
      setSelectedClaimId(claimId);
    } else {
      setSelectedClaimId(null);
    }
  }

  // Add a new claim
  function handleAddClaim(claimData) {
    const newClaim = {
      ...claimData,
      id: generateClaimId(claims),
      dateFiled: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const updated = [...claims, newClaim];
    saveClaims(updated);
    handleNavigate('dashboard');
  }

  // Update claim status
  function handleUpdateStatus(claimId, newStatus) {
    const updated = claims.map((c) => {
      if (c.id === claimId) {
        return {
          ...c,
          status: newStatus,
          statusHistory: [
            ...c.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return c;
    });
    saveClaims(updated);
  }

  // Filter and search handlers
  function handleSetFilter(status) {
    setFilterStatus(status);
  }

  function handleSetSearch(query) {
    setSearchQuery(query);
  }

  // Get selected claim for detail view
  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || null;

  return (
    <div className="app">
      <Header onNewClaim={() => handleNavigate('new-claim')} />
      <div className="main-content">
        {currentView === 'dashboard' && (
          <>
            <SummaryCards claims={claims} />
            <ClaimsList
              claims={claims}
              filterStatus={filterStatus}
              searchQuery={searchQuery}
              onSetFilter={handleSetFilter}
              onSetSearch={handleSetSearch}
              onViewClaim={(id) => handleNavigate('claim-detail', id)}
            />
          </>
        )}

        {currentView === 'new-claim' && (
          <NewClaimForm
            onSubmit={handleAddClaim}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'claim-detail' && (
          <ClaimDetail
            claim={selectedClaim}
            onBack={() => handleNavigate('dashboard')}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
}

export default App;