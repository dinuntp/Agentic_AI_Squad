import React from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SummaryCards({ claims }) {
  const totalClaims = claims.length;

  const pendingReview = claims.filter(
    (c) => c.status === 'Submitted' || c.status === 'Under Review'
  ).length;

  const approvedClaims = claims.filter((c) => c.status === 'Approved');
  const approvedCount = approvedClaims.length;
  const approvedAmount = approvedClaims.reduce((sum, c) => sum + c.amount, 0);

  const rejectedCount = claims.filter((c) => c.status === 'Rejected').length;

  return (
    <div className="summary-cards" data-testid="summary-cards">
      <div className="summary-card summary-card--total" data-testid="card-total">
        <div className="summary-card__label">Total Claims</div>
        <div className="summary-card__value">{totalClaims}</div>
      </div>

      <div className="summary-card summary-card--pending" data-testid="card-pending">
        <div className="summary-card__label">Pending Review</div>
        <div className="summary-card__value">{pendingReview}</div>
        <div className="summary-card__sub">Submitted + Under Review</div>
      </div>

      <div className="summary-card summary-card--approved" data-testid="card-approved">
        <div className="summary-card__label">Approved</div>
        <div className="summary-card__value">{approvedCount}</div>
        <div className="summary-card__sub">{formatCurrency(approvedAmount)} total</div>
      </div>

      <div className="summary-card summary-card--rejected" data-testid="card-rejected">
        <div className="summary-card__label">Rejected</div>
        <div className="summary-card__value">{rejectedCount}</div>
      </div>
    </div>
  );
}

export { formatCurrency };