import React, { useState } from 'react';

const FILTER_OPTIONS = ['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function ClaimsList({ claims, onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = claims.filter((claim) => {
    const matchesFilter =
      activeFilter === 'All' || claim.status === activeFilter;
    const matchesSearch =
      searchTerm === '' ||
      claim.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div className="claims-section">
      <div className="filter-bar">
        <div className="filter-tabs">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
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
      </div>

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
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-state">
                No claims found matching your criteria.
              </td>
            </tr>
          ) : (
            filtered.map((claim) => (
              <tr
                key={claim.id}
                onClick={() => onNavigate('claim-detail', claim.id)}
              >
                <td className="claim-id-cell">{claim.id}</td>
                <td>{claim.claimantName}</td>
                <td>{claim.type}</td>
                <td>{claim.dateFiled}</td>
                <td>${claim.amount.toLocaleString('en-US')}</td>
                <td>
                  <span className={getStatusClass(claim.status)}>
                    {claim.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('claim-detail', claim.id);
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
  );
}

export default ClaimsList;