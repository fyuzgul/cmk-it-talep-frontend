import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import inventoryService from '../../services/inventoryService';
import InventoryForm from './InventoryForm';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  DocumentArrowDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const InventoryList = () => {
  const { user } = useAuth();
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('createdDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAllInventories();
      setInventories(data);
      setError(null);
    } catch (err) {
      setError('Envanter listesi yüklenirken hata oluştu.');
      console.error('Error fetching inventories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInventory(null);
    setShowForm(true);
  };

  const handleEdit = (inventory) => {
    setEditingInventory(inventory);
    setShowForm(true);
  };

  const handleView = (inventory) => {
    setEditingInventory(inventory);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu envanter kaydını silmek istediğinizden emin misiniz?')) {
      try {
        await inventoryService.deleteInventory(id);
        setInventories(inventories.filter(inv => inv.id !== id));
      } catch (err) {
        setError('Envanter silinirken hata oluştu.');
        console.error('Error deleting inventory:', err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`${selectedItems.length} envanter kaydını silmek istediğinizden emin misiniz?`)) {
      try {
        await Promise.all(selectedItems.map(id => inventoryService.deleteInventory(id)));
        setInventories(inventories.filter(inv => !selectedItems.includes(inv.id)));
        setSelectedItems([]);
      } catch (err) {
        setError('Envanter kayıtları silinirken hata oluştu.');
        console.error('Error deleting inventories:', err);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInventory(null);
  };

  const handleFormSubmit = async (inventoryData) => {
    console.log('handleFormSubmit called with:', inventoryData);
    try {
      if (editingInventory) {
        console.log('Updating inventory:', editingInventory.id);
        await inventoryService.updateInventory(editingInventory.id, inventoryData);
        setInventories(inventories.map(inv => 
          inv.id === editingInventory.id ? { ...inventoryData, id: editingInventory.id } : inv
        ));
      } else {
        console.log('Creating new inventory');
        const newInventory = await inventoryService.createInventory(inventoryData);
        console.log('New inventory created:', newInventory);
        setInventories([...inventories, newInventory]);
      }
      setShowForm(false);
      setEditingInventory(null);
    } catch (err) {
      console.error('Error saving inventory:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(`Envanter kaydedilirken hata oluştu: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredInventories.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventories.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredInventories = useMemo(() => {
    let filtered = inventories.filter(inventory => {
      const matchesSearch = 
        inventory.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventory.computerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventory.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventory.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventory.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !filterDepartment || inventory.department === filterDepartment;

      return matchesSearch && matchesDepartment;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdDate') {
        aValue = new Date(a.createdDate);
        bValue = new Date(b.createdDate);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [inventories, searchTerm, filterDepartment, sortBy, sortOrder]);

  const departments = useMemo(() => {
    const deptSet = new Set(inventories.map(inv => inv.department).filter(Boolean));
    return Array.from(deptSet).sort();
  }, [inventories]);

  const stats = useMemo(() => {
    return {
      total: inventories.length,
      byDepartment: departments.reduce((acc, dept) => {
        acc[dept] = inventories.filter(inv => inv.department === dept).length;
        return acc;
      }, {}),
      withComputer: inventories.filter(inv => inv.computerName).length,
      withSerial: inventories.filter(inv => inv.serialNumber).length
    };
  }, [inventories, departments]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Envanter Yönetimi</h1>
            <p className="text-sm sm:text-base text-gray-600">Bilgisayar envanterini yönetin ve takip edin</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Yeni Envanter</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <ComputerDesktopIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <ChartBarIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Bilgisayarlı</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.withComputer}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <DocumentArrowDownIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Seri Nolu</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.withSerial}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <Squares2X2Icon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Departman</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Envanter ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ListBulletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
            >
              <option value="createdDate">Tarih</option>
              <option value="fullName">Ad Soyad</option>
              <option value="computerName">Bilgisayar Adı</option>
              <option value="department">Departman</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowsUpDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
                showFilters 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
              <span className="sm:hidden">Filtre</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departman</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tüm Departmanlar</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-medium">
              {selectedItems.length} öğe seçildi
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Seçilenleri Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredInventories.map((inventory) => (
            <div key={inventory.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(inventory.id)}
                      onChange={() => handleSelectItem(inventory.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                      {inventory.fullName?.charAt(0) || '?'}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleView(inventory)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(inventory)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(inventory.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {inventory.fullName || 'İsimsiz'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {inventory.department || 'Departman yok'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {inventory.computerName || 'Bilgisayar yok'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {inventory.username || 'Kullanıcı adı yok'}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">Seri: {inventory.serialNumber || 'Yok'}</span>
                    <span className="ml-2 flex-shrink-0">{new Date(inventory.createdDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredInventories.length && filteredInventories.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departman
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bilgisayar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seri No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşletim Sistemi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventories.map((inventory) => (
                  <tr key={inventory.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(inventory.id)}
                        onChange={() => handleSelectItem(inventory.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                          {inventory.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {inventory.fullName || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inventory.username || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inventory.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inventory.computerName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inventory.serialNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inventory.operatingSystem || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inventory.createdDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(inventory)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Görüntüle"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(inventory)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Düzenle"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inventory.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Sil"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredInventories.map((inventory) => (
                <div key={inventory.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(inventory.id)}
                        onChange={() => handleSelectItem(inventory.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {inventory.fullName?.charAt(0) || '?'}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleView(inventory)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(inventory)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inventory.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {inventory.fullName || 'İsimsiz'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Departman:</span>
                        <p className="truncate">{inventory.department || 'Yok'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Bilgisayar:</span>
                        <p className="truncate">{inventory.computerName || 'Yok'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Seri No:</span>
                        <p className="truncate">{inventory.serialNumber || 'Yok'}</p>
                      </div>
                      <div>
                        <span className="font-medium">İşletim Sistemi:</span>
                        <p className="truncate">{inventory.operatingSystem || 'Yok'}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {new Date(inventory.createdDate).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredInventories.length === 0 && (
        <div className="text-center py-12">
          <ComputerDesktopIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterDepartment ? 'Arama kriterlerine uygun envanter bulunamadı' : 'Henüz envanter kaydı bulunmuyor'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterDepartment ? 'Farklı arama terimleri deneyin' : 'İlk envanter kaydınızı oluşturun'}
          </p>
          {!searchTerm && !filterDepartment && (
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Envanter Ekle
            </button>
          )}
        </div>
      )}

      {showForm && (
        <InventoryForm
          inventory={editingInventory}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default InventoryList;