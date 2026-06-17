import React from 'react';

export default function Header({ onNewClaim }) {
  return (
    <header className="header" data-testid="header">
      <h1 className="header__title">Insurance Claim Management Dashboard</h1>
      <button
        className="header__btn"
        onClick={onNewClaim}
        data-testid="new-claim-btn"
      >
        + New Claim
      </button>
    </header>
  );
}