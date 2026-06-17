import React, { useState } from 'react';

const CLAIM_TYPES = ['Auto', 'Health', 'Property', 'Life'];

function generateClaimId(existingIds) {
  // Find the highest existing CLM-XXXX number and increment
  let maxNum = 1000;
  existingIds.forEach((id) => {
    const match = id.match(/^CLM-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `CLM-${maxNum + 1}`;
}

function validateForm(values) {
  const errors = {};

  if (!values.claimantName.trim()) {
    errors.claimantName = 'Claimant name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.';
  }

  if (!values.type) {
    errors.type = 'Please select a claim type.';
  }

  if (!values.incidentDate) {
    errors.incidentDate = 'Incident date is required.';
  } else {
    const incident = new Date(values.incidentDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (incident > today) {
      errors.incidentDate = 'Incident date cannot be in the future.';
    }
  }

  if (!values.amount || values.amount === '') {
    errors.amount = 'Claim amount is required.';
  } else if (Number(values.amount) < 1) {
    errors.amount = 'Claim amount must be at least $1.';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  } else if (values.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  }

  return errors;
}

const INITIAL_VALUES = {
  claimantName: '',
  email: '',
  phone: '',
  type: '',
  incidentDate: '',
  amount: '',
  description: '',
};

export default function NewClaimForm({ onSubmit, onCancel, existingIds }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear error on change if field was touched
    if (touched[name]) {
      const newValues = { ...values, [name]: value };
      const newErrors = validateForm(newValues);
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] || '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const currentErrors = validateForm(values);
    setErrors((prev) => ({ ...prev, [name]: currentErrors[name] || '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(INITIAL_VALUES).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    const formErrors = validateForm(values);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    const now = new Date();
    const dateFiled = now.toISOString().split('T')[0];
    const newClaim = {
      id: generateClaimId(existingIds),
      claimantName: values.claimantName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      type: values.type,
      incidentDate: values.incidentDate,
      amount: Number(values.amount),
      description: values.description.trim(),
      status: 'Submitted',
      dateFiled,
      history: [
        {
          status: 'Submitted',
          timestamp: now.toISOString(),
        },
      ],
    };

    onSubmit(newClaim);
  };

  const getInputClass = (field, baseClass) => {
    const hasError = touched[field] && errors[field];
    return `${baseClass} ${hasError ? `${baseClass}--error` : ''}`;
  };

  return (
    <div className="form-container view-enter" data-testid="new-claim-form">
      <button className="back-btn" onClick={onCancel} type="button" data-testid="form-cancel-back">
        ← Back to Dashboard
      </button>
      <div className="form-card">
        <h2 className="form-card__title">Submit New Claim</h2>
        <p className="form-card__subtitle">
          Fill out the form below to submit a new insurance claim.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {/* Claimant Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="claimantName">
                Claimant Full Name <span className="form-label__required">*</span>
              </label>
              <input
                id="claimantName"
                name="claimantName"
                type="text"
                className={getInputClass('claimantName', 'form-input')}
                value={values.claimantName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. John Smith"
                data-testid="input-claimantName"
              />
              <div className="form-error" data-testid="error-claimantName">
                {touched.claimantName && errors.claimantName ? errors.claimantName : ''}
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span className="form-label__required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={getInputClass('email', 'form-input')}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. john@example.com"
                data-testid="input-email"
              />
              <div className="form-error" data-testid="error-email">
                {touched.email && errors.email ? errors.email : ''}
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number <span className="form-label__required">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className={getInputClass('phone', 'form-input')}
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 555-0123"
                data-testid="input-phone"
              />
              <div className="form-error" data-testid="error-phone">
                {touched.phone && errors.phone ? errors.phone : ''}
              </div>
            </div>

            {/* Claim Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="type">
                Claim Type <span className="form-label__required">*</span>
              </label>
              <select
                id="type"
                name="type"
                className={getInputClass('type', 'form-select')}
                value={values.type}
                onChange={handleChange}
                onBlur={handleBlur}
                data-testid="input-type"
              >
                <option value="">Select claim type...</option>
                {CLAIM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="form-error" data-testid="error-type">
                {touched.type && errors.type ? errors.type : ''}
              </div>
            </div>

            {/* Incident Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="incidentDate">
                Incident Date <span className="form-label__required">*</span>
              </label>
              <input
                id="incidentDate"
                name="incidentDate"
                type="date"
                className={getInputClass('incidentDate', 'form-input')}
                value={values.incidentDate}
                onChange={handleChange}
                onBlur={handleBlur}
                data-testid="input-incidentDate"
              />
              <div className="form-error" data-testid="error-incidentDate">
                {touched.incidentDate && errors.incidentDate ? errors.incidentDate : ''}
              </div>
            </div>

            {/* Claim Amount */}
            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Claim Amount ($) <span className="form-label__required">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                className={getInputClass('amount', 'form-input')}
                value={values.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 5000"
                data-testid="input-amount"
              />
              <div className="form-error" data-testid="error-amount">
                {touched.amount && errors.amount ? errors.amount : ''}
              </div>
            </div>

            {/* Description */}
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="description">
                Description of Incident <span className="form-label__required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                className={getInputClass('description', 'form-textarea')}
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Provide a detailed description of the incident (minimum 20 characters)..."
                rows={4}
                data-testid="input-description"
              />
              <div className="form-error" data-testid="error-description">
                {touched.description && errors.description ? errors.description : ''}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
              data-testid="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" data-testid="btn-submit">
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CLAIM_TYPES, generateClaimId, validateForm, INITIAL_VALUES };