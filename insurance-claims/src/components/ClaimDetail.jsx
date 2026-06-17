import React from 'react';

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

function getTimelineDotClass(status) {
  switch (status) {
    case 'Submitted':
      return 'timeline-dot timeline-dot--submitted';
    case 'Under Review':
      return 'timeline-dot timeline-dot--under-review';
    case 'Approved':
      return 'timeline-dot timeline-dot--approved';
    case 'Rejected':
      return 'timeline-dot timeline-dot--rejected';
    default:
      return 'timeline-dot';
  }
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ClaimDetail({ claim, onBack, onUpdateStatus }) {
  if (!claim) {
    return (
      <div className="main-content">
        <button className="detail-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <p>Claim not found.</p>
      </div>
    );
  }

  const { status, statusHistory } = claim;

  // Sort history chronologically (oldest first)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div>
      <button className="detail-back" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <div className="detail-header">
        <span className="detail-header__id">{claim.id}</span>
        <span className={getStatusBadgeClass(claim.status)}>{claim.status}</span>
        <span className="detail-header__date">Filed on {claim.dateFiled}</span>
      </div>

      <div className="detail-columns">
        {/* Left Column — Claim Information */}
        <div className="detail-left">
          <h3 className="detail-section-title">Claim Information</h3>

          <div className="detail-field">
            <div className="detail-field__label">Claimant Name</div>
            <div className="detail-field__value">{claim.claimantName}</div>
          </div>

          <div className="detail-field">
            <div className="detail-field__label">Email Address</div>
            <div className="detail-field__value">{claim.email}</div>
          </div>

          <div className="detail-field">
            <div className="detail-field__label">Phone Number</div>
            <div className="detail-field__value">{claim.phone}</div>
          </div>

          <div className="detail-field">
            <div className="detail-field__label">Claim Type</div>
            <div className="detail-field__value">{claim.type}</div>
          </div>

          <div className="detail-field">
            <div className="detail-field__label">Incident Date</div>
            <div className="detail-field__value">{claim.incidentDate}</div>
          </div>

          <div className="detail-field">
            <div className="detail-field__label">Claim Amount</div>
            <div className="detail-field__value">
              ${claim.amount.toLocaleString('en-US')}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-field__label">Description</div>
            <div className="detail-field__value">{claim.description}</div>
          </div>
        </div>

        {/* Right Column — Status & Workflow */}
        <div className="detail-right">
          {/* Workflow Panel */}
          <div className="workflow-panel">
            <h3 className="detail-section-title">Status Workflow</h3>

            <div className="workflow-panel__current">
              <span className="workflow-panel__current-label">Current Status:</span>
              <span className={getStatusBadgeClass(status)}>{status}</span>
            </div>

            <div className="workflow-actions">
              {status === 'Submitted' && (
                <button
                  className="btn-workflow btn-workflow--review"
                  onClick={() => onUpdateStatus(claim.id, 'Under Review')}
                >
                  Mark Under Review
                </button>
              )}

              {status === 'Under Review' && (
                <>
                  <button
                    className="btn-workflow btn-workflow--approve"
                    onClick={() => onUpdateStatus(claim.id, 'Approved')}
                  >
                    Approve Claim
                  </button>
                  <button
                    className="btn-workflow btn-workflow--reject"
                    onClick={() => onUpdateStatus(claim.id, 'Rejected')}
                  >
                    Reject Claim
                  </button>
                </>
              )}

              {status === 'Approved' && (
                <div className="workflow-final workflow-final--approved">
                  ✓ This claim has been approved
                </div>
              )}

              {status === 'Rejected' && (
                <div className="workflow-final workflow-final--rejected">
                  ✕ This claim has been rejected
                </div>
              )}
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="timeline-panel">
            <h3 className="detail-section-title">Status History</h3>

            <div className="timeline">
              {sortedHistory.map((entry, index) => (
                <div className="timeline-entry" key={index}>
                  <div className={getTimelineDotClass(entry.status)} />
                  <div className="timeline-entry__status">{entry.status}</div>
                  <div className="timeline-entry__time">
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimDetail;