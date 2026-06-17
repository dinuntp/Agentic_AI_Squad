import React from 'react';

function SummaryCards({ claims }) {
  const totalClaims = claims.length;

  const pendingReview = claims.filter(
    (c) => c.status === 'Submitted' || c.status === 'Under Review'
  ).length;

  const approvedClaims = claims.filter((c) => c.status === 'Approved');
  const approvedCount = approvedClaims.length;
  const approvedTotal = approvedClaims.reduce((sum, c) => sum + c.amount, 0);

  const rejectedCount = claims.filter((c) => c.status === 'Rejected').length;

  return (
    <div className="summary-cards">
      <div className="card card-total">
        <div className="card-label">Total Claims</div>
        <div className="card-value">{totalClaims}</div>
      </div>
      <div className="card card-pending">
        <div className="card-label">Pending Review</div>
        <div className="card-value">{pendingReview}</div>
      </div>
      <div className="card card-approved">
        <div className="card-label">Approved</div>
        <div className="card-value">{approvedCount}</div>
        <div className="card-sub">${approvedTotal.toLocaleString('en-US')}</div>
      </div>
      <div className="card card-rejected">
        <div className="card-label">Rejected</div>
        <div className="card-value">{rejectedCount}</div>
      </div>
    </div>
  );
}

export default SummaryCards;