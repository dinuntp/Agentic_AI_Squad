import React, { useState } from 'react';

const CLAIM_TYPES = ['Auto', 'Health', 'Property', 'Life'];

const INITIAL_FORM_DATA = {
  claimantName: '',
  email: '',
  phone: '',
  type: '',
  incidentDate: '',
  amount: '',
  description: ''
};

function NewClaimForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [errors, setErrors] = useState({});

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.claimantName.trim()) {
      newErrors.claimantName = 'Claimant Full Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required';
    }

    if (!formData.type) {
      newErrors.type = 'Claim Type is required';
    }

    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Incident Date is required';
    } else if (formData.incidentDate > getTodayString()) {
      newErrors.incidentDate = 'Incident date cannot be in the future';
    }

    if (!formData.amount) {
      newErrors.amount = 'Claim Amount is required';
    } else if (parseFloat(formData.amount) < 1) {
      newErrors.amount = 'Amount must be at least $1';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description of Incident is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    return newErrors;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
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

  const inputClass = (field) => {
    return errors[field] ? 'input-error' : '';
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Submit New Claim</h2>
      <p className="form-subtitle">Fill in the details below to submit a new insurance claim.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="claimantName">
            Claimant Full Name <span className="required">*</span>
          </label>
          <input
            id="claimantName"
            type="text"
            className={inputClass('claimantName')}
            value={formData.claimantName}
            onChange={(e) => handleChange('claimantName', e.target.value)}
            placeholder="Enter full name"
          />
          {errors.claimantName && <div className="form-error">{errors.claimantName}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={inputClass('email')}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="name@example.com"
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              id="phone"
              type="text"
              className={inputClass('phone')}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="555-0100"
            />
            {errors.phone && <div className="form-error">{errors.phone}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">
              Claim Type <span className="required">*</span>
            </label>
            <select
              id="type"
              className={inputClass('type')}
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="">Select claim type</option>
              {CLAIM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.type && <div className="form-error">{errors.type}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="incidentDate">
              Incident Date <span className="required">*</span>
            </label>
            <input
              id="incidentDate"
              type="date"
              className={inputClass('incidentDate')}
              value={formData.incidentDate}
              max={getTodayString()}
              onChange={(e) => handleChange('incidentDate', e.target.value)}
            />
            {errors.incidentDate && <div className="form-error">{errors.incidentDate}</div>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            Claim Amount ($) <span className="required">*</span>
          </label>
          <input
            id="amount"
            type="number"
            className={inputClass('amount')}
            value={formData.amount}
            min="1"
            step="0.01"
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
          />
          {errors.amount && <div className="form-error">{errors.amount}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description of Incident <span className="required">*</span>
          </label>
          <textarea
            id="description"
            className={inputClass('description')}
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