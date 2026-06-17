import React, { useState } from 'react';

const CLAIM_TYPES = ['Auto', 'Health', 'Property', 'Life'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NewClaimForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    claimantName: '',
    email: '',
    phone: '',
    type: '',
    incidentDate: '',
    amount: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const newErrors = {};

    if (!formData.claimantName.trim()) {
      newErrors.claimantName = 'Claimant name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }

    if (!formData.type) {
      newErrors.type = 'Claim type is required.';
    }

    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Incident date is required.';
    } else {
      // Use YYYY-MM-DD string comparison to avoid timezone issues
      const today = new Date().toISOString().split('T')[0];
      if (formData.incidentDate > today) {
        newErrors.incidentDate = 'Incident date cannot be in the future.';
      }
    }

    if (!formData.amount) {
      newErrors.amount = 'Claim amount is required.';
    } else if (parseFloat(formData.amount) < 1) {
      newErrors.amount = 'Claim amount must be at least $1.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters.';
    }

    return newErrors;
  }

  function handleSubmit(e) {
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
      description: formData.description.trim(),
    });
  }

  return (
    <div className="form-container">
      <h2 className="form-container__title">File a New Claim</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="claimantName">Claimant Full Name</label>
          <input
            id="claimantName"
            type="text"
            className={errors.claimantName ? 'input-error' : ''}
            value={formData.claimantName}
            onChange={(e) => handleChange('claimantName', e.target.value)}
            placeholder="Enter full name"
          />
          {errors.claimantName && <div className="form-error">{errors.claimantName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className={errors.email ? 'input-error' : ''}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter email address"
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="text"
            className={errors.phone ? 'input-error' : ''}
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="claimType">Claim Type</label>
          <select
            id="claimType"
            className={errors.type ? 'input-error' : ''}
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">Select claim type...</option>
            {CLAIM_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.type && <div className="form-error">{errors.type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="incidentDate">Incident Date</label>
          <input
            id="incidentDate"
            type="date"
            className={errors.incidentDate ? 'input-error' : ''}
            value={formData.incidentDate}
            onChange={(e) => handleChange('incidentDate', e.target.value)}
          />
          {errors.incidentDate && <div className="form-error">{errors.incidentDate}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Claim Amount ($)</label>
          <input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            className={errors.amount ? 'input-error' : ''}
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="Enter claim amount"
          />
          {errors.amount && <div className="form-error">{errors.amount}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description of Incident</label>
          <textarea
            id="description"
            className={errors.description ? 'input-error' : ''}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe the incident in detail (minimum 20 characters)..."
          />
          {errors.description && <div className="form-error">{errors.description}</div>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            Submit Claim
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewClaimForm;