import React, { useState } from 'react';

const CLAIM_TYPES = ['Auto', 'Health', 'Property', 'Life'];

const INITIAL_FORM_DATA = {
  claimantName: '',
  email: '',
  phone: '',
  type: 'Auto',
  incidentDate: '',
  amount: '',
  description: '',
};

function NewClaimForm({ onAddClaim, onNavigate }) {
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.claimantName.trim()) {
      newErrors.claimantName = 'Claimant name is required';
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    } else {
      const incidentDateValue = new Date(formData.incidentDate + 'T23:59:59');
      const today = new Date();
      if (incidentDateValue > today) {
        newErrors.incidentDate = 'Incident date cannot be in the future';
      }
    }

    if (!formData.amount || parseFloat(formData.amount) < 1) {
      newErrors.amount = 'Claim amount must be at least $1';
    }

    if (
      !formData.description.trim() ||
      formData.description.trim().length < 20
    ) {
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
    onAddClaim({
      claimantName: formData.claimantName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      type: formData.type,
      incidentDate: formData.incidentDate,
      amount: parseFloat(formData.amount),
      description: formData.description.trim(),
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="form-container">
      <h2 className="form-title">File a New Claim</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="claimantName">Claimant Full Name</label>
          <input
            type="text"
            id="claimantName"
            name="claimantName"
            value={formData.claimantName}
            onChange={handleChange}
            className={errors.claimantName ? 'input-error' : ''}
            placeholder="Enter full name"
          />
          {errors.claimantName && (
            <span className="field-error">{errors.claimantName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'input-error' : ''}
            placeholder="Enter email address"
          />
          {errors.email && (
            <span className="field-error">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'input-error' : ''}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <span className="field-error">{errors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="type">Claim Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            {CLAIM_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="incidentDate">Incident Date</label>
          <input
            type="date"
            id="incidentDate"
            name="incidentDate"
            value={formData.incidentDate}
            onChange={handleChange}
            max={todayStr}
            className={errors.incidentDate ? 'input-error' : ''}
          />
          {errors.incidentDate && (
            <span className="field-error">{errors.incidentDate}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Claim Amount ($)</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="1"
            step="0.01"
            className={errors.amount ? 'input-error' : ''}
            placeholder="Enter claim amount"
          />
          {errors.amount && (
            <span className="field-error">{errors.amount}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description of Incident</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? 'input-error' : ''}
            placeholder="Describe the incident in detail (minimum 20 characters)"
            rows="4"
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('dashboard')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Claim
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewClaimForm;