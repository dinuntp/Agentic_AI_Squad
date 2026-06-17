import React from 'react';

export default function Header({ onNewClaim, onNavigateHome }) {
  return (
    <header className="header">
      <h1
        className="header-title"
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigateHome();
          }
        }}
      >
        Insurance Claim Management Dashboard
      </h1>
      <button
        className="btn-new-claim"
        onClick={onNewClaim}
      >
        + New Claim
      </button>
    </header>
  );
}