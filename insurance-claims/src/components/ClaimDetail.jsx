import React from 'react';

function ClaimDetail({ claim, onStatusChange, onBack }) {
  if (!claim) {
    return (
      <div className="detail-container">
        <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
        <p>Claim not found.</p>
      </div>
    );
  }

  const getStatusClass = (status) => {
    const map = {
      'Submitted': 'badge-submitted',
      'Under Review': 'badge-under-review',
      'Approved': 'badge-approved',
      'Rejected': 'badge-rejected'
    };
    return 'badge ' + (map[status] || '');
  };

  const getTimelineStatusClass = (status) => {
    const map = {
      'Submitted': 'status-submitted',
      'Under Review': 'status-under-review',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected'
    };
    return 'timeline-item ' + (map[status] || '');
  };

  const formatCurrency = (amount) => {
    return '$' + amount.toLocaleString();
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderWorkflowActions = () => {
    switch (claim.status) {
      case 'Submitted':
        return (
          <div className="workflow-actions">
            <button
              className="btn-workflow btn-review"
              onClick={() => onStatusChange(claim.id, 'Under Review')}
            >
              Mark Under Review
            </button>
          </div>
        );
      case 'Under Review':
        return (
          <div className="workflow-actions">
            <button
              className="btn-workflow btn-approve"
              onClick={() => onStatusChange(claim.id, 'Approved')}
            >
              Approve Claim
            </button>
            <button
              className="btn-workflow btn-reject"
              onClick={() => onStatusChange(claim.id, 'Rejected')}
            >
              Reject Claim
            </button>
          </div>
        );
      case 'Approved':
        return (
          <div className="workflow-final final-approved">
            ✓ This claim has been approved
          </div>
        );
      case 'Rejected':
        return (
          <div className="workflow-final final-rejected">
            ✗ This claim has been rejected
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="detail-container">
      <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="detail-header">
        <h2>{claim.id}</h2>
        <span className={getStatusClass(claim.status)}>{claim.status}</span>
        <span className="filed-date">Filed on {claim.dateFiled}</span>
      </div>

      <div className="detail-grid">
        {/* Left column — Claim Information */}
        <div className="detail-card">
          <h3>Claim Information</h3>

          <div className="field-group">
            <div className="field-label">Claimant Name</div>
            <div className="field-value">{claim.claimantName}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Email Address</div>
            <div className="field-value">{claim.email}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Phone Number</div>
            <div className="field-value">{claim.phone}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Claim Type</div>
            <div className="field-value">{claim.type}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Incident Date</div>
            <div className="field-value">{claim.incidentDate}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Claim Amount</div>
            <div className="field-value amount">{formatCurrency(claim.amount)}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Description</div>
            <div className="field-value">{claim.description}</div>
          </div>
        </div>

        {/* Right column — Workflow + Timeline */}
        <div>
          <div className="detail-card">
            <h3>Status Workflow</h3>
            <div className="workflow-panel">
              <h4>Current Status</h4>
              <div className="workflow-current">
                <span>Status:</span>
                <span className={getStatusClass(claim.status)}>{claim.status}</span>
              </div>
              {renderWorkflowActions()}
            </div>
          </div>

          <div className="detail-card" style={{ marginTop: '24px' }}>
            <h3>Status History</h3>
            <div className="timeline">
              {claim.history.map((entry, index) => (
                <div key={index} className={getTimelineStatusClass(entry.status)}>
                  <div className="timeline-status">{entry.status}</div>
                  <div className="timeline-date">{formatDate(entry.timestamp)}</div>
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