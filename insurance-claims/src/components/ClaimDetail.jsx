import React from 'react';

const STATUS_CLASS_MAP = {
  'Submitted': 'status-badge--submitted',
  'Under Review': 'status-badge--under-review',
  'Approved': 'status-badge--approved',
  'Rejected': 'status-badge--rejected'
};

const TIMELINE_DOT_CLASS_MAP = {
  'Submitted': 'timeline-dot--submitted',
  'Under Review': 'timeline-dot--under-review',
  'Approved': 'timeline-dot--approved',
  'Rejected': 'timeline-dot--rejected'
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

const formatTimestamp = (isoString) => {
  return new Date(isoString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export default function ClaimDetail({ claim, onBack, onUpdateStatus }) {
  const isTerminal = claim.status === 'Approved' || claim.status === 'Rejected';

  const renderWorkflowActions = () => {
    switch (claim.status) {
      case 'Submitted':
        return (
          <button
            className="btn-workflow btn-workflow--under-review"
            onClick={() => onUpdateStatus(claim.id, 'Under Review')}
          >
            Mark Under Review
          </button>
        );
      case 'Under Review':
        return (
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
        );
      case 'Approved':
        return (
          <div className="workflow-final workflow-final--approved">
            This claim has been approved
          </div>
        );
      case 'Rejected':
        return (
          <div className="workflow-final workflow-final--rejected">
            This claim has been rejected
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="claim-detail">
      <button className="btn-back" onClick={onBack}>
        ← Back to Claims
      </button>

      <div className="claim-detail__header">
        <h2 className="claim-detail__id">{claim.id}</h2>
        <span className={`status-badge ${STATUS_CLASS_MAP[claim.status] || ''}`}>
          {claim.status}
        </span>
        <span className="claim-detail__date">
          Filed on {formatDate(claim.dateFiled)}
        </span>
      </div>

      <div className="claim-detail__grid">
        {/* Left Column — Claim Information */}
        <div className="detail-card">
          <h3 className="detail-card__title">Claim Information</h3>

          <div className="detail-field">
            <span className="detail-field__label">Claimant Name</span>
            <span className="detail-field__value">{claim.claimantName}</span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Email Address</span>
            <span className="detail-field__value">{claim.email}</span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Phone Number</span>
            <span className="detail-field__value">{claim.phone}</span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Claim Type</span>
            <span className="detail-field__value">{claim.type}</span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Incident Date</span>
            <span className="detail-field__value">{formatDate(claim.incidentDate)}</span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Claim Amount</span>
            <span className="detail-field__value detail-field__value--amount">
              {formatCurrency(claim.amount)}
            </span>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">Description</span>
            <span className="detail-field__value detail-field__value--description">
              {claim.description}
            </span>
          </div>
        </div>

        {/* Right Column — Status & History */}
        <div className="detail-right-column">
          {/* Status Workflow Panel */}
          <div className="detail-card workflow-card">
            <h3 className="detail-card__title">Status Workflow</h3>
            <div className="workflow-current">
              <span className="workflow-current__label">Current Status</span>
              <span className={`status-badge status-badge--lg ${STATUS_CLASS_MAP[claim.status] || ''}`}>
                {claim.status}
              </span>
            </div>
            <div className="workflow-actions">
              {renderWorkflowActions()}
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="detail-card timeline-card">
            <h3 className="detail-card__title">Status History</h3>
            <div className="timeline">
              {claim.statusHistory.map((entry, index) => (
                <div
                  key={`${entry.status}-${entry.timestamp}`}
                  className={`timeline-item ${index === claim.statusHistory.length - 1 ? 'timeline-item--last' : ''}`}
                >
                  <div className={`timeline-dot ${TIMELINE_DOT_CLASS_MAP[entry.status] || ''}`} />
                  <div className="timeline-content">
                    <span className={`status-badge status-badge--sm ${STATUS_CLASS_MAP[entry.status] || ''}`}>
                      {entry.status}
                    </span>
                    <span className="timeline-timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </span>
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

export { STATUS_CLASS_MAP, TIMELINE_DOT_CLASS_MAP, formatCurrency, formatDate, formatTimestamp };