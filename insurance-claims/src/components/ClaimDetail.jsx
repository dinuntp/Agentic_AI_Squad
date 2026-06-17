import React from 'react';

function ClaimDetail({ claim, onNavigate, onStatusChange }) {
  if (!claim) {
    return (
      <div className="detail-container">
        <button
          className="back-btn"
          onClick={() => onNavigate('dashboard')}
        >
          ← Back to Dashboard
        </button>
        <div className="detail-panel">
          <h3>Claim Not Found</h3>
          <p>The requested claim could not be found.</p>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const getAvailableActions = (status) => {
    switch (status) {
      case 'Submitted':
        return [{ label: 'Mark Under Review', nextStatus: 'Under Review', className: 'btn btn-primary' }];
      case 'Under Review':
        return [
          { label: 'Approve Claim', nextStatus: 'Approved', className: 'btn btn-success' },
          { label: 'Reject Claim', nextStatus: 'Rejected', className: 'btn btn-danger' },
        ];
      default:
        return [];
    }
  };

  const actions = getAvailableActions(claim.status);
  const isTerminal = claim.status === 'Approved' || claim.status === 'Rejected';

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="detail-container">
      <button
        className="back-btn"
        onClick={() => onNavigate('dashboard')}
      >
        ← Back to Dashboard
      </button>

      <div className="detail-header">
        <h2>Claim {claim.id}</h2>
        <span className={getStatusClass(claim.status)}>{claim.status}</span>
        <span className="date-filed">Filed: {claim.dateFiled}</span>
      </div>

      <div className="detail-grid">
        {/* Left Panel: Claim Information */}
        <div className="detail-panel">
          <h3>Claim Information</h3>
          <div className="detail-row">
            <span className="label">Claimant Name</span>
            <span className="value">{claim.claimantName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email</span>
            <span className="value">{claim.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone</span>
            <span className="value">{claim.phone}</span>
          </div>
          <div className="detail-row">
            <span className="label">Claim Type</span>
            <span className="value">{claim.type}</span>
          </div>
          <div className="detail-row">
            <span className="label">Incident Date</span>
            <span className="value">{claim.incidentDate}</span>
          </div>
          <div className="detail-row">
            <span className="label">Amount</span>
            <span className="value">${claim.amount.toLocaleString('en-US')}</span>
          </div>
          <div className="detail-row description-row">
            <span className="label">Description</span>
            <span className="value">{claim.description}</span>
          </div>
        </div>

        {/* Right Panel: Status Workflow + Timeline */}
        <div className="detail-panel">
          <h3>Status Workflow</h3>

          <div className="workflow-section">
            <div className="current-status">
              Current Status: <span className={getStatusClass(claim.status)}>{claim.status}</span>
            </div>

            {actions.length > 0 && (
              <div className="workflow-actions">
                {actions.map((action) => (
                  <button
                    key={action.nextStatus}
                    className={action.className}
                    onClick={() => onStatusChange(claim.id, action.nextStatus)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {isTerminal && (
              <div
                className={`final-status-message ${
                  claim.status === 'Approved' ? 'approved-msg' : 'rejected-msg'
                }`}
              >
                This claim has been {claim.status.toLowerCase()}.
              </div>
            )}
          </div>

          <h3>Status History</h3>
          <div className="timeline">
            {claim.statusHistory.map((entry, index) => (
              <div className="timeline-item" key={index}>
                <div className="timeline-status">{entry.status}</div>
                <div className="timeline-date">
                  {formatTimestamp(entry.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimDetail;