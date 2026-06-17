import React, { useState } from 'react';

const FILTER_TABS = ['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

const STATUS_CLASS_MAP = {
  'Submitted': 'status-badge--submitted',
  'Under Review': 'status-badge--under-review',
  'Approved': 'status-badge--approved',
  'Rejected': 'status-badge--rejected'
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ClaimsList({ claims, onViewClaim }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClaims = claims.filter(claim => {
    const matchesFilter = activeFilter === 'All' || claim.status === activeFilter;
    const matchesSearch = searchTerm === '' ||
      claim.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTabCount = (tab) => {
    if (tab === 'All') return claims.length;
    return claims.filter(c => c.status === tab).length;
  };

  return (
    <div className="claims-list">
      <div className="filter-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`filter-tab ${activeFilter === tab ? 'filter-tab--active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
            <span className="filter-tab__count">{getTabCount(tab)}</span>
          </button>
        ))}
      </div>

      <input
        type="text"
        className="search-input"
        placeholder="Search by name or claim ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="table-container">
        <table className="claims-table">
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
                <td colSpan="7" className="table-empty">
                  No claims found
                </td>
              </tr>
            ) : (
              filteredClaims.map(claim => (
                <tr
                  key={claim.id}
                  onClick={() => onViewClaim(claim.id)}
                  className="claims-table__row"
                >
                  <td className="claim-id-cell">{claim.id}</td>
                  <td>{claim.claimantName}</td>
                  <td>{claim.type}</td>
                  <td>{formatDate(claim.dateFiled)}</td>
                  <td className="amount-cell">{formatCurrency(claim.amount)}</td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS_MAP[claim.status] || ''}`}>
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

export { FILTER_TABS, STATUS_CLASS_MAP, formatCurrency, formatDate };