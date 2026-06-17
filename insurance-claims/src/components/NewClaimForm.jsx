import React, { useState } from 'react';

const CLAIM_TYPES = ['Auto', 'Health', 'Property', 'Life'];

const INITIAL_FORM = {
  claimantName: '',
  email: '',
  phone: '',
  type: '',
  incidentDate: '',
  amount: '',
  description: '',
};

function generateClaimId(existingIds) {
  // Find the highest numeric suffix in existing IDs and increment
  let maxNum = 1000;
  for (const id of existingIds) {
    const match = id.match(/CLM-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `CLM-${maxNum + 1}`;
}

function validateForm(form) {
  const errors = {};

  if (!form.claimantName.trim()) {
    errors.claimantName = 'Claimant name is required.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required.';
  }

  if (!form.type) {
    errors.type = 'Please select a claim type.';
  }

  if (!form.incidentDate) {
    errors.incidentDate = 'Incident date is required.';
  } else {
    const selected = new Date(form.incidentDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected > today) {
      errors.incidentDate = 'Incident date cannot be in the future.';
    }
  }

  const amountNum = parseFloat(form.amount);
  if (!form.amount && form.amount !== 0) {
    errors.amount = 'Claim amount is required.';
  } else if (isNaN(amountNum) || amountNum < 1) {
    errors.amount = 'Claim amount must be at least $1.';
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.';
  } else if (form.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  }

  return errors;
}

export default function NewClaimForm({ onSubmit, onCancel, existingIds }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error on change after first submit attempt
    if (submitted && errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const now = new Date();
    const dateFiled = now.toISOString().split('T')[0];
    const newClaim = {
      id: generateClaimId(existingIds),
      claimantName: form.claimantName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      type: form.type,
      incidentDate: form.incidentDate,
      amount: parseFloat(form.amount),
      description: form.description.trim(),
      status: 'Submitted',
      dateFiled,
      history: [
        { status: 'Submitted', timestamp: now.toISOString() },
      ],
    };

    onSubmit(newClaim);
  };

  const inputClass = (field) =>
    `form-input ${errors[field] ? 'form-input--error' : ''}`;

  return (
    <div className="form-container" data-testid="new-claim-form">
      <div className="form-card">
        <h2 className="form-card__title">Submit New Claim</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {/* Claimant Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="claimantName">
                Claimant Full Name<span className="form-label__required">*</span>
              </label>
              <input
                id="claimantName"
                name="claimantName"
                type="text"
                className={inputClass('claimantName')}
                value={form.claimantName}
                onChange={handleChange}
                placeholder="Enter full name"
                data-testid="input-claimantName"
              />
              <div className="form-error" data-testid="error-claimantName">
                {errors.claimantName || ''}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address<span className="form-label__required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={inputClass('email')}
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                data-testid="input-email"
              />
              <div className="form-error" data-testid="error-email">
                {errors.email || ''}
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number<span className="form-label__required">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className={inputClass('phone')}
                value={form.phone}
                onChange={handleChange}
                placeholder="555-0100"
                data-testid="input-phone"
              />
              <div className="form-error" data-testid="error-phone">
                {errors.phone || ''}
              </div>
            </div>

            {/* Claim Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="type">
                Claim Type<span className="form-label__required">*</span>
              </label>
              <select
                id="type"
                name="type"
                className={`form-select ${errors.type ? 'form-select--error' : ''}`}
                value={form.type}
                onChange={handleChange}
                data-testid="input-type"
              >
                <option value="">Select type...</option>
                {CLAIM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="form-error" data-testid="error-type">
                {errors.type || ''}
              </div>
            </div>

            {/* Incident Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="incidentDate">
                Incident Date<span className="form-label__required">*</span>
              </label>
              <input
                id="incidentDate"
                name="incidentDate"
                type="date"
                className={inputClass('incidentDate')}
                value={form.incidentDate}
                onChange={handleChange}
                data-testid="input-incidentDate"
              />
              <div className="form-error" data-testid="error-incidentDate">
                {errors.incidentDate || ''}
              </div>
            </div>

            {/* Claim Amount */}
            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Claim Amount ($)<span className="form-label__required">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                className={inputClass('amount')}
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                data-testid="input-amount"
              />
              <div className="form-error" data-testid="error-amount">
                {errors.amount || ''}
              </div>
            </div>

            {/* Description */}
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="description">
                Description of Incident<span className="form-label__required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                className={`form-textarea ${errors.description ? 'form-textarea--error' : ''}`}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the incident in detail (minimum 20 characters)..."
                data-testid="input-description"
              />
              <div className="form-error" data-testid="error-description">
                {errors.description || ''}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              data-testid="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              data-testid="btn-submit"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CLAIM_TYPES, INITIAL_FORM, generateClaimId, validateForm };