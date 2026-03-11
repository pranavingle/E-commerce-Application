import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zip: user?.address?.zip || '',
      country: user?.address?.country || '',
    },
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await updateProfile(payload);
      updateUser(data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <h2 className="fw-bold mb-4">My Profile</h2>

      {/* Avatar */}
      <div className="card border-0 shadow-sm mb-4 text-center p-4" style={{ borderRadius: 16 }}>
        <div
          className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
          style={{ width: 90, height: 90, background: '#e44d26', color: 'white', fontSize: '2.5rem', fontWeight: 700 }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h5 className="mt-3 fw-bold">{user?.name}</h5>
        <span className="badge" style={{ background: '#e44d26', borderRadius: 20 }}>
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
        </span>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <h6 className="fw-bold mb-3"><FiUser className="me-2 text-danger" />Personal Information</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold"><FiMail className="me-1" />Email</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold"><FiPhone className="me-1" />Phone</label>
                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">New Password</label>
                <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" style={{ borderRadius: 8 }} />
              </div>
            </div>

            <h6 className="fw-bold mb-3"><FiMapPin className="me-2 text-danger" />Address</h6>
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="form-label fw-semibold">Street</label>
                <input className="form-control" value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">City</label>
                <input className="form-control" value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">State</label>
                <input className="form-control" value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">PIN Code</label>
                <input className="form-control" value={form.address.zip} onChange={e => setForm({ ...form, address: { ...form.address, zip: e.target.value } })} style={{ borderRadius: 8 }} />
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Country</label>
                <input className="form-control" value={form.address.country} onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} style={{ borderRadius: 8 }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn w-100"
              style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: 14, fontWeight: 700 }}
              disabled={saving}
            >
              <FiSave className="me-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
