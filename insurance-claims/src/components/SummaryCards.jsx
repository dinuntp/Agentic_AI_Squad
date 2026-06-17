import React from 'react';

function SummaryCards({ stats }) {
  const formatCurrency = (amount) => {
    return '$' + amount.toLocaleString();
  };

  return (
    <div className="summary-cards">
      <div className="summary-card card-total">
        <div className="card-label">Total Claims</div>
        <div className="card-value">{stats.total}</div>
      </div>

      <div className="summary-card card-pending">
        <div className="card-label">Pending Review</div>
        <div className="card-value">{stats.pendingReview}</div>
        <div className="card-subtitle">Submitted + Under Review</div>
      </div>

      <div className="summary-card card-approved">
        <div className="card-label">Approved</div>
        <div className="card-value">{stats.approved}</div>
        <div className="card-subtitle">{formatCurrency(stats.approvedAmount)} total</div>
      </div>

      <div className="summary-card card-rejected">
        <div className="card-label">Rejected</div>
        <div className="card-value">{stats.rejected}</div>
      </div>
    </div>
  );
}

export default SummaryCards;