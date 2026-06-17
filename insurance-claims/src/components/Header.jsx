import React from 'react';

export default function Header({ onNewClaim, showNewClaim }) {
  return (
    <header className="header" data-testid="header">
      <div className="header__logo">
        <span className="header__logo-icon">🛡️</span>
        <h1 className="header__title">Insurance Claim Management Dashboard</h1>
      </div>
      {showNewClaim && (
        <button
          className="btn btn--primary"
          onClick={onNewClaim}
          data-testid="new-claim-btn"
        >
          + New Claim
        </button>
      )}
    </header>
  );
}