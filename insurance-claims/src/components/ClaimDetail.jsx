import React from 'react';

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

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClaimDetail({ claim, onBack, onUpdateClaim }) {
  const handleStatusChange = (newStatus) => {
    const updatedClaim = {
      ...claim,
      status: newStatus,
      history: [
        ...claim.history,
        { status: newStatus, timestamp: new Date().toISOString() },
      ],
    };
    onUpdateClaim(updatedClaim);
  };

  const renderWorkflowActions = () => {
    switch (claim.status) {
      case 'Submitted':
        return (
          <div className="workflow-actions">
            <button
              className="btn-workflow btn-workflow--review"
              onClick={() => handleStatusChange('Under Review')}
              data-testid="btn-under-review"
            >
              Mark Under Review
            </button>
          </div>
        );
      case 'Under Review':
        return (
          <div className="workflow-actions">
            <button
              className="btn-workflow btn-workflow--approve"
              onClick={() => handleStatusChange('Approved')}
              data-testid="btn-approve"
            >
              Approve Claim
            </button>
            <button
              className="btn-workflow btn-workflow--reject"
              onClick={() => handleStatusChange('Rejected')}
              data-testid="btn-reject"
            >
              Reject Claim
            </button>
          </div>
        );
      case 'Approved':
        return (
          <div className="workflow-final workflow-final--approved" data-testid="final-approved">
            ✓ This claim has been approved
          </div>
        );
      case 'Rejected':
        return (
          <div className="workflow-final workflow-final--rejected" data-testid="final-rejected">
            ✕ This claim has been rejected
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="detail-container" data-testid="claim-detail">
      <button className="btn-back" onClick={onBack} data-testid="btn-back">
        ← Back to Dashboard
      </button>

      <div className="detail-header">
        <div>
          <div className="detail-header__id" data-testid="detail-claim-id">
            {claim.id}
          </div>
          <div className="detail-header__date">
            Filed on {claim.dateFiled}
          </div>
        </div>
        <span
          className={`status-badge status-badge--${getStatusClass(claim.status)}`}
          data-testid="detail-status-badge"
        >
          {claim.status}
        </span>
      </div>

      <div className="detail-body">
        {/* Left Column — Claim Information */}
        <div className="detail-info" data-testid="detail-info">
          <h3 className="detail-info__title">Claim Information</h3>

          <div className="detail-field">
            <span className="detail-field__label">Claimant Name</span>
            <span className="detail-field__value" data-testid="detail-claimantName">
              {claim.claimantName}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Email Address</span>
            <span className="detail-field__value" data-testid="detail-email">
              {claim.email}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Phone Number</span>
            <span className="detail-field__value" data-testid="detail-phone">
              {claim.phone}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Claim Type</span>
            <span className="detail-field__value" data-testid="detail-type">
              {claim.type}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Incident Date</span>
            <span className="detail-field__value" data-testid="detail-incidentDate">
              {claim.incidentDate}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Claim Amount</span>
            <span className="detail-field__value" data-testid="detail-amount">
              {formatCurrency(claim.amount)}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Description</span>
            <span className="detail-field__value" data-testid="detail-description">
              {claim.description}
            </span>
          </div>
        </div>

        {/* Right Column — Status Workflow & History */}
        <div className="workflow-panel" data-testid="workflow-panel">
          <h3 className="workflow-panel__title">Status Workflow</h3>

          <div className="workflow-current">
            <span className="workflow-current__label">Current Status:</span>
            <span className={`status-badge status-badge--${getStatusClass(claim.status)}`}>
              {claim.status}
            </span>
          </div>

          {renderWorkflowActions()}

          <div className="timeline__title">Status History</div>
          <div className="timeline" data-testid="status-timeline">
            {claim.history.map((entry, index) => (
              <div className="timeline-item" key={index} data-testid={`timeline-item-${index}`}>
                <div className={`timeline-item__dot timeline-item__dot--${getStatusClass(entry.status)}`} />
                <div className="timeline-item__status">{entry.status}</div>
                <div className="timeline-item__time">
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

export { getStatusClass, formatCurrency, formatTimestamp };