import React from 'react';

const STATUS_TABS = ['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function ClaimsList({ claims, filterStatus, searchQuery, onFilterChange, onSearchChange, onSelectClaim }) {
  const getStatusClass = (status) => {
    const map = {
      'Submitted': 'badge-submitted',
      'Under Review': 'badge-under-review',
      'Approved': 'badge-approved',
      'Rejected': 'badge-rejected'
    };
    return 'badge ' + (map[status] || '');
  };

  const formatCurrency = (amount) => {
    return '$' + amount.toLocaleString();
  };

  return (
    <div className="claims-section">
      <div className="filter-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={'filter-tab' + (filterStatus === tab ? ' active' : '')}
            onClick={() => onFilterChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or Claim ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {claims.length === 0 ? (
        <div className="no-claims">No claims found matching your criteria.</div>
      ) : (
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
            {claims.map((claim) => (
              <tr key={claim.id} onClick={() => onSelectClaim(claim.id)}>
                <td className="claim-id">{claim.id}</td>
                <td>{claim.claimantName}</td>
                <td>{claim.type}</td>
                <td>{claim.dateFiled}</td>
                <td className="amount">{formatCurrency(claim.amount)}</td>
                <td>
                  <span className={getStatusClass(claim.status)}>{claim.status}</span>
                </td>
                <td>
                  <button
                    className="btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClaim(claim.id);
                    }}
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

export default ClaimsList;