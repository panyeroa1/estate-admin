import React, { useMemo, useState } from 'react';
import { Plus, MapPin, Home, DollarSign, Bed, Bath, Edit, Trash2, Search, Tag } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { Property } from '../types';

interface PropertiesViewProps {
  properties: Property[];
  addProperty: (property: Omit<Property, 'id'>) => void;
  updateProperty: (id: string, data: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
}

const propertyTypes: Property['type'][] = ['apartment', 'house', 'villa', 'commercial', 'land'];
const propertyStatuses: Property['status'][] = ['active', 'pending', 'sold', 'rented'];

const PropertiesView: React.FC<PropertiesViewProps> = ({ properties, addProperty, updateProperty, deleteProperty }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Property>>({
    status: 'active',
    type: 'house',
    price: 0,
  });

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return properties.filter(prop =>
      prop.name.toLowerCase().includes(query) || prop.address.toLowerCase().includes(query)
    );
  }, [properties, search]);

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ status: 'active', type: 'house', price: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setEditingId(property.id);
    setFormData(property);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.address || formData.price === undefined) return;

    const payload: Omit<Property, 'id'> = {
      name: formData.name,
      address: formData.address,
      price: Number(formData.price),
      type: formData.type || 'house',
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      size: formData.size ? Number(formData.size) : undefined,
      status: formData.status || 'active',
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    if (editingId) {
      updateProperty(editingId, payload);
    } else {
      addProperty(payload);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ status: 'active', type: 'house', price: 0 });
  };

  const StatusBadge = ({ status }: { status: Property['status'] }) => {
    const styles: Record<Property['status'], string> = {
      active: 'bg-blue-100 text-blue-700',
      pending: 'bg-amber-100 text-amber-700',
      sold: 'bg-emerald-100 text-emerald-700',
      rented: 'bg-purple-100 text-purple-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
          <p className="text-gray-500">Listings with full details and quick status changes.</p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Plus size={18} /> Add Property
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search by name or address"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(property => (
          <div key={property.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Home size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {property.address}
                </p>
              </div>
              <StatusBadge status={property.status} />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><DollarSign size={14} />{property.price.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Tag size={14} className="text-gray-400" />{property.type}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms ?? '-'} bd</div>
              <div className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms ?? '-'} ba</div>
              <div className="flex items-center gap-1">{property.size ? `${property.size} m²` : 'Size n/a'}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => openEditModal(property)}
                className="px-3 py-1 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => deleteProperty(property.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 inline-flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-12">No properties found.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Property' : 'Add Property'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-name">Name</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-name"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-address">Address</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-address"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-price">Price (€)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-price"
                value={formData.price ?? ''}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-type">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-type"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as Property['type'] })}
              >
                {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-status">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-status"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Property['status'] })}
              >
                {propertyStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-bedrooms">Bedrooms</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-bedrooms"
                value={formData.bedrooms ?? ''}
                onChange={e => setFormData({ ...formData, bedrooms: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-bathrooms">Bathrooms</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-bathrooms"
                value={formData.bathrooms ?? ''}
                onChange={e => setFormData({ ...formData, bathrooms: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property-size">Size (m²)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="property-size"
                value={formData.size ?? ''}
                onChange={e => setFormData({ ...formData, size: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? 'Save Changes' : 'Add Property'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PropertiesView;
