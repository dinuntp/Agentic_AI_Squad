import React, { useMemo } from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SummaryCards({ claims }) {
  const stats = useMemo(() => {
    const total = claims.length;
    const submitted = claims.filter((c) => c.status === 'Submitted').length;
    const underReview = claims.filter((c) => c.status === 'Under Review').length;
    const pending = submitted + underReview;
    const approved = claims.filter((c) => c.status === 'Approved');
    const approvedCount = approved.length;
    const approvedAmount = approved.reduce((sum, c) => sum + c.amount, 0);
    const rejected = claims.filter((c) => c.status === 'Rejected').length;

    return { total, pending, approvedCount, approvedAmount, rejected };
  }, [claims]);

  return (
    <div className="summary-cards" data-testid="summary-cards">
      <div className="summary-card summary-card--total" data-testid="card-total">
        <div className="summary-card__label">Total Claims</div>
        <div className="summary-card__value">{stats.total}</div>
      </div>

      <div className="summary-card summary-card--pending" data-testid="card-pending">
        <div className="summary-card__label">Pending Review</div>
        <div className="summary-card__value">{stats.pending}</div>
        <div className="summary-card__sub">Submitted + Under Review</div>
      </div>

      <div className="summary-card summary-card--approved" data-testid="card-approved">
        <div className="summary-card__label">Approved</div>
        <div className="summary-card__value">{stats.approvedCount}</div>
        <div className="summary-card__sub">{formatCurrency(stats.approvedAmount)} total</div>
      </div>

      <div className="summary-card summary-card--rejected" data-testid="card-rejected">
        <div className="summary-card__label">Rejected</div>
        <div className="summary-card__value">{stats.rejected}</div>
      </div>
    </div>
  );
}

export { formatCurrency };