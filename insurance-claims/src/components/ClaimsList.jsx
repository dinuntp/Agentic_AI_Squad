import React from 'react';

const STATUS_OPTIONS = ['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Submitted':
      return 'status-badge status-badge--submitted';
    case 'Under Review':
      return 'status-badge status-badge--under-review';
    case 'Approved':
      return 'status-badge status-badge--approved';
    case 'Rejected':
      return 'status-badge status-badge--rejected';
    default:
      return 'status-badge';
  }
}

function ClaimsList({ claims, filterStatus, searchQuery, onSetFilter, onSetSearch, onViewClaim }) {
  // Apply status filter
  let filtered = claims;
  if (filterStatus !== 'All') {
    filtered = filtered.filter((c) => c.status === filterStatus);
  }

  // Apply search filter (AND logic)
  if (searchQuery.trim() !== '') {
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.claimantName.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
    );
  }

  // Count claims per status for tab labels
  const statusCounts = {};
  STATUS_OPTIONS.forEach((s) => {
    if (s === 'All') {
      statusCounts[s] = claims.length;
    } else {
      statusCounts[s] = claims.filter((c) => c.status === s).length;
    }
  });

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-tabs">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              className={`filter-tab ${filterStatus === status ? 'filter-tab--active' : ''}`}
              onClick={() => onSetFilter(status)}
            >
              {status} ({statusCounts[status]})
            </button>
          ))}
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search by Claimant Name or Claim ID..."
          value={searchQuery}
          onChange={(e) => onSetSearch(e.target.value)}
        />
      </div>

      <div className="claims-table-wrapper">
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
                <td colSpan="7" className="claims-table__empty">
                  No claims found.
                </td>
              </tr>
            ) : (
              filtered.map((claim) => (
                <tr
                  key={claim.id}
                  className="claim-row"
                  onClick={() => onViewClaim(claim.id)}
                >
                  <td><strong>{claim.id}</strong></td>
                  <td>{claim.claimantName}</td>
                  <td>{claim.type}</td>
                  <td>{claim.dateFiled}</td>
                  <td>${claim.amount.toLocaleString('en-US')}</td>
                  <td>
                    <span className={getStatusBadgeClass(claim.status)}>
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

export default ClaimsList;