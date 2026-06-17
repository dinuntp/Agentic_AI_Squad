import React, { useState, useMemo } from 'react';

const FILTER_TABS = ['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function getStatusClass(status) {
  const map = {
    'Submitted': 'submitted',
    'Under Review': 'under-review',
    'Approved': 'approved',
    'Rejected': 'rejected',
  };
  return map[status] || 'submitted';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ClaimsList({ claims, onViewClaim }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClaims = useMemo(() => {
    let result = claims;

    // Apply status filter
    if (activeFilter !== 'All') {
      result = result.filter((c) => c.status === activeFilter);
    }

    // Apply search filter (AND logic with status filter)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.claimantName.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term)
      );
    }

    return result;
  }, [claims, activeFilter, searchTerm]);

  return (
    <div data-testid="claims-list">
      <div className="filter-bar">
        <div className="filter-tabs" data-testid="filter-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${activeFilter === tab ? 'filter-tab--active' : ''}`}
              onClick={() => setActiveFilter(tab)}
              data-testid={`filter-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or Claim ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="search-input"
        />
      </div>

      <div className="claims-table-wrapper">
        <table className="claims-table" data-testid="claims-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Claimant Name</th>
              <th>Type</th>
              <th>Date Filed</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan="7" className="claims-table__empty">
                  No claims found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim) => (
                <tr
                  key={claim.id}
                  onClick={() => onViewClaim(claim.id)}
                  data-testid={`claim-row-${claim.id}`}
                >
                  <td>{claim.id}</td>
                  <td>{claim.claimantName}</td>
                  <td>{claim.type}</td>
                  <td>{claim.dateFiled}</td>
                  <td>{formatCurrency(claim.amount)}</td>
                  <td>
                    <span className={`status-badge status-badge--${getStatusClass(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewClaim(claim.id);
                      }}
                      data-testid={`view-btn-${claim.id}`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { FILTER_TABS, getStatusClass };