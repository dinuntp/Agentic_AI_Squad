import React, { useState, useMemo } from 'react';

const FILTER_OPTIONS = ['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function getStatusClass(status) {
  const map = {
    Submitted: 'submitted',
    'Under Review': 'under-review',
    Approved: 'approved',
    Rejected: 'rejected',
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

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ClaimsList({ claims, onViewClaim }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClaims = useMemo(() => {
    let result = claims;

    // Filter by status
    if (activeFilter !== 'All') {
      result = result.filter((c) => c.status === activeFilter);
    }

    // Filter by search term (AND logic with status filter)
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
    <div className="claims-section" data-testid="claims-section">
      <div className="claims-toolbar" data-testid="claims-toolbar">
        <div className="filter-tabs" data-testid="filter-tabs">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              className={`filter-tab ${
                activeFilter === option ? 'filter-tab--active' : ''
              }`}
              onClick={() => setActiveFilter(option)}
              data-testid={`filter-${option.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {option}
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

      {filteredClaims.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <div className="empty-state__icon">📋</div>
          <p className="empty-state__text">No claims found matching your criteria.</p>
        </div>
      ) : (
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
            {filteredClaims.map((claim) => (
              <tr
                key={claim.id}
                onClick={() => onViewClaim(claim.id)}
                data-testid={`claim-row-${claim.id}`}
              >
                <td className="claim-id-cell">{claim.id}</td>
                <td>{claim.claimantName}</td>
                <td>{claim.type}</td>
                <td>{formatDate(claim.dateFiled)}</td>
                <td className="amount-cell">{formatCurrency(claim.amount)}</td>
                <td>
                  <span
                    className={`status-badge status-badge--${getStatusClass(
                      claim.status
                    )}`}
                  >
                    {claim.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn--ghost"
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export { FILTER_OPTIONS, getStatusClass, formatCurrency, formatDate };