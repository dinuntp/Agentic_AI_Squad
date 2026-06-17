/**
 * Utility functions for the Insurance Claims application.
 * Extracted for testability and reusability.
 */

/**
 * Returns the CSS class string for a status badge.
 * @param {string} status - The claim status
 * @returns {string} CSS class string
 */
export function getStatusClass(status) {
  const map = {
    'Submitted': 'badge-submitted',
    'Under Review': 'badge-under-review',
    'Approved': 'badge-approved',
    'Rejected': 'badge-rejected'
  };
  return 'badge ' + (map[status] || '');
}

/**
 * Returns the timeline CSS class for a given status.
 * @param {string} status
 * @returns {string}
 */
export function getTimelineStatusClass(status) {
  const map = {
    'Submitted': 'status-submitted',
    'Under Review': 'status-under-review',
    'Approved': 'status-approved',
    'Rejected': 'status-rejected'
  };
  return 'timeline-item ' + (map[status] || '');
}

/**
 * Formats a number as USD currency string.
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return '$' + amount.toLocaleString();
}

/**
 * Formats an ISO date string to a human-readable format.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Generates the next claim ID from an existing claims array.
 * @param {Array} claims - Current claims array
 * @returns {string} Next claim ID (e.g., "CLM-1007")
 */
export function generateNextClaimId(claims) {
  const maxNum = claims.reduce((max, c) => {
    const num = parseInt(c.id.split('-')[1], 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 1000);
  return 'CLM-' + (maxNum + 1);
}

/**
 * Filters claims based on status filter and search query (AND logic).
 * @param {Array} claims - All claims
 * @param {string} filterStatus - 'All' or a specific status
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered claims
 */
export function filterClaims(claims, filterStatus, searchQuery) {
  return claims.filter((claim) => {
    const matchesStatus = filterStatus === 'All' || claim.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      claim.claimantName.toLowerCase().includes(query) ||
      claim.id.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });
}

/**
 * Computes summary statistics from claims array.
 * @param {Array} claims
 * @returns {Object} { total, pendingReview, approved, approvedAmount, rejected }
 */
export function computeSummaryStats(claims) {
  return claims.reduce(
    (acc, claim) => {
      acc.total += 1;
      if (claim.status === 'Submitted' || claim.status === 'Under Review') {
        acc.pendingReview += 1;
      }
      if (claim.status === 'Approved') {
        acc.approved += 1;
        acc.approvedAmount += claim.amount;
      }
      if (claim.status === 'Rejected') {
        acc.rejected += 1;
      }
      return acc;
    },
    { total: 0, pendingReview: 0, approved: 0, approvedAmount: 0, rejected: 0 }
  );
}

/**
 * Validates a new claim form data object.
 * @param {Object} formData - The form data to validate
 * @param {string} todayString - Today's date in YYYY-MM-DD format
 * @returns {Object} errors - Object with field keys and error messages (empty if valid)
 */
export function validateClaimForm(formData, todayString) {
  const errors = {};

  if (!formData.claimantName || !formData.claimantName.trim()) {
    errors.claimantName = 'Claimant Full Name is required';
  }

  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email Address is required';
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
  }

  if (!formData.phone || !formData.phone.trim()) {
    errors.phone = 'Phone Number is required';
  }

  if (!formData.type) {
    errors.type = 'Claim Type is required';
  }

  if (!formData.incidentDate) {
    errors.incidentDate = 'Incident Date is required';
  } else if (formData.incidentDate > todayString) {
    errors.incidentDate = 'Incident date cannot be in the future';
  }

  if (!formData.amount && formData.amount !== 0) {
    errors.amount = 'Claim Amount is required';
  } else if (parseFloat(formData.amount) < 1) {
    errors.amount = 'Amount must be at least $1';
  }

  if (!formData.description || !formData.description.trim()) {
    errors.description = 'Description of Incident is required';
  } else if (formData.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }

  return errors;
}

/**
 * Returns the available status transitions for a given status.
 * @param {string} currentStatus
 * @returns {Array} Array of available next statuses
 */
export function getAvailableTransitions(currentStatus) {
  const transitions = {
    'Submitted': ['Under Review'],
    'Under Review': ['Approved', 'Rejected'],
    'Approved': [],
    'Rejected': []
  };
  return transitions[currentStatus] || [];
}