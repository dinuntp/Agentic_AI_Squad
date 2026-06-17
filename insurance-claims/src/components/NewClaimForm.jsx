import React, { useState } from 'react';

const CLAIM_TYPES = ['Auto', 'Health', 'Property', 'Life'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialFormState = {
  claimantName: '',
  email: '',
  phone: '',
  type: '',
  incidentDate: '',
  amount: '',
  description: ''
};

export default function NewClaimForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ ...initialFormState });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    const todayString = getTodayString();

    if (!formData.claimantName.trim()) {
      newErrors.claimantName = 'Claimant name is required';
    }

    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Valid email address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.type || !CLAIM_TYPES.includes(formData.type)) {
      newErrors.type = 'Please select a claim type';
    }

    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Incident date is required and cannot be a future date';
    } else if (formData.incidentDate > todayString) {
      newErrors.incidentDate = 'Incident date is required and cannot be a future date';
    }

    if (!formData.amount || parseFloat(formData.amount) < 1) {
      newErrors.amount = 'Claim amount must be at least $1';
    }

    if (!formData.description.trim() || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({
      claimantName: formData.claimantName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      type: formData.type,
      incidentDate: formData.incidentDate,
      amount: parseFloat(formData.amount),
      description: formData.description.trim()
    });
  };

  return (
    <div className="new-claim-form-card">
      <h2 className="form-title">File a New Claim</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="claimantName" className="form-label">
              Claimant Full Name
            </label>
            <input
              type="text"
              id="claimantName"
              name="claimantName"
              className={`form-input ${errors.claimantName ? 'form-input--error' : ''}`}
              value={formData.claimantName}
              onChange={handleChange}
              placeholder="Enter full name"
            />
            {errors.claimantName && (
              <span className="form-error">{errors.claimantName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <span className="form-error">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="type" className="form-label">
              Claim Type
            </label>
            <select
              id="type"
              name="type"
              className={`form-input form-select ${errors.type ? 'form-input--error' : ''}`}
              value={formData.type}
              onChange={handleChange}
            >
              <option value="" disabled>Select claim type</option>
              {CLAIM_TYPES.map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
            {errors.type && (
              <span className="form-error">{errors.type}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="incidentDate" className="form-label">
              Incident Date
            </label>
            <input
              type="date"
              id="incidentDate"
              name="incidentDate"
              className={`form-input ${errors.incidentDate ? 'form-input--error' : ''}`}
              value={formData.incidentDate}
              onChange={handleChange}
              max={getTodayString()}
            />
            {errors.incidentDate && (
              <span className="form-error">{errors.incidentDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Claim Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              className={`form-input ${errors.amount ? 'form-input--error' : ''}`}
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter claim amount"
              min="1"
              step="0.01"
            />
            {errors.amount && (
              <span className="form-error">{errors.amount}</span>
            )}
          </div>

          <div className="form-group form-group--full">
            <label htmlFor="description" className="form-label">
              Description of Incident
            </label>
            <textarea
              id="description"
              name="description"
              className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the incident in detail (minimum 20 characters)"
              rows="4"
            />
            {errors.description && (
              <span className="form-error">{errors.description}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
          >
            Submit Claim
          </button>
        </div>
      </form>
    </div>
  );
}

export { CLAIM_TYPES, EMAIL_REGEX, getTodayString };