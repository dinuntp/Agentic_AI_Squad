import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ClaimsList from './components/ClaimsList.jsx';
import NewClaimForm from './components/NewClaimForm.jsx';
import ClaimDetail from './components/ClaimDetail.jsx';

const STORAGE_KEY = 'insuranceClaims';

const SEED_CLAIMS = [
  {
    id: 'CLM-1001',
    claimantName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-0101',
    type: 'Auto',
    incidentDate: '2026-05-10',
    dateFiled: '2026-05-10',
    amount: 4200,
    description: 'Rear-end collision at intersection resulting in bumper and trunk damage to vehicle.',
    status: 'Approved',
    statusHistory: [
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
    description: 'Emergency room visit and subsequent hospitalization for acute appendicitis surgery.',
    status: 'Under Review',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-05-18T10:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-20T09:15:00.000Z' }
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
    description: 'Storm damage to roof and flooding in basement requiring extensive repairs and restoration.',
    status: 'Submitted',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-05-25T08:30:00.000Z' }
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
    description: 'Life insurance claim filed following the passing of the policyholder due to natural causes.',
    status: 'Rejected',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-04-30T11:00:00.000Z' },
      { status: 'Under Review', timestamp: '2026-05-02T13:45:00.000Z' },
      { status: 'Rejected', timestamp: '2026-05-10T16:20:00.000Z' }
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
    description: 'Side-impact collision in parking lot causing significant door and panel damage to vehicle.',
    status: 'Submitted',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-06-01T14:00:00.000Z' }
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
    description: 'Outpatient surgical procedure for torn meniscus including physical therapy sessions.',
    status: 'Under Review',
    statusHistory: [
      { status: 'Submitted', timestamp: '2026-06-05T09:30:00.000Z' },
      { status: 'Under Review', timestamp: '2026-06-07T10:00:00.000Z' }
    ]
  }
];

const VALID_TRANSITIONS = {
  'Submitted': ['Under Review'],
  'Under Review': ['Approved', 'Rejected'],
  'Approved': [],
  'Rejected': []
};

function loadClaimsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Corrupted data — fall back to seed
  }
  return null;
}

export default function App() {
  const [claims, setClaims] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const isInitialized = useRef(false);

  // Load claims from localStorage or seed on mount
  useEffect(() => {
    const storedClaims = loadClaimsFromStorage();
    if (storedClaims) {
      setClaims(storedClaims);
    } else {
      setClaims(SEED_CLAIMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CLAIMS));
    }
    isInitialized.current = true;
  }, []);

  // Persist claims to localStorage whenever they change (after initialization)
  useEffect(() => {
    if (isInitialized.current && claims.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    }
  }, [claims]);

  const navigateTo = useCallback((view, claimId = null) => {
    setCurrentView(view);
    setSelectedClaimId(claimId);
  }, []);

  const generateClaimId = useCallback(() => {
    const maxNum = claims.reduce((max, c) => {
      const num = parseInt(c.id.split('-')[1], 10);
      return num > max ? num : max;
    }, 1000);
    return `CLM-${maxNum + 1}`;
  }, [claims]);

  const addClaim = useCallback((formData) => {
    const newClaim = {
      id: generateClaimId(),
      claimantName: formData.claimantName,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      incidentDate: formData.incidentDate,
      dateFiled: new Date().toISOString().split('T')[0],
      amount: parseFloat(formData.amount),
      description: formData.description,
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString()
        }
      ]
    };
    setClaims(prev => [...prev, newClaim]);
    navigateTo('dashboard');
  }, [generateClaimId, navigateTo]);

  const updateClaimStatus = useCallback((claimId, newStatus) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id !== claimId) return claim;

      // Validate transition
      const allowedTransitions = VALID_TRANSITIONS[claim.status] || [];
      if (!allowedTransitions.includes(newStatus)) {
        return claim; // Invalid transition — ignore
      }

      return {
        ...claim,
        status: newStatus,
        statusHistory: [
          ...claim.statusHistory,
          {
            status: newStatus,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }));
  }, []);

  const selectedClaim = claims.find(c => c.id === selectedClaimId) || null;

  const renderView = () => {
    switch (currentView) {
      case 'new-claim':
        return (
          <div className="main-container fade-in">
            <NewClaimForm
              onSubmit={addClaim}
              onCancel={() => navigateTo('dashboard')}
            />
          </div>
        );
      case 'claim-detail':
        return (
          <div className="main-container fade-in">
            {selectedClaim ? (
              <ClaimDetail
                claim={selectedClaim}
                onBack={() => navigateTo('dashboard')}
                onUpdateStatus={updateClaimStatus}
              />
            ) : (
              <div className="empty-state">
                <p>Claim not found.</p>
                <button
                  className="btn-primary"
                  onClick={() => navigateTo('dashboard')}
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="main-container fade-in">
            <SummaryCards claims={claims} />
            <ClaimsList
              claims={claims}
              onViewClaim={(claimId) => navigateTo('claim-detail', claimId)}
            />
          </div>
        );
    }
  };

  return (
    <div className="app">
      <Header
        onNewClaim={() => navigateTo('new-claim')}
        onNavigateHome={() => navigateTo('dashboard')}
      />
      {renderView()}
    </div>
  );
}

export { SEED_CLAIMS, STORAGE_KEY, VALID_TRANSITIONS };