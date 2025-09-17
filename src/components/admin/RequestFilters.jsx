import React, { useState, useEffect } from 'react';

const RequestFilters = ({
  filters,
  onFilterChange,
  requestTypes,
  requestStatuses,
  users
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleInputChange = (field, value) => {
    if (field === 'search') {
      setSearchValue(value);
    } else {
      onFilterChange({ [field]: value });
    }
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFilterChange({
      search: '',
      statusId: '',
      typeId: '',
      creatorId: '',
      supportProviderId: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdDate',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined && 
    !(value === 'createdDate' && filters.sortBy === 'createdDate') &&
    !(value === 'desc' && filters.sortOrder === 'desc')
  );

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col space-y-4">
        {/* Search and Basic Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              id="search"
              value={searchValue}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Açıklama ile ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="sm:w-48">
            <label htmlFor="statusId" className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              id="statusId"
              value={filters.statusId}
              onChange={(e) => handleInputChange('statusId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tümü</option>
              {requestStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-48">
            <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 mb-1">
              Talep Türü
            </label>
            <select
              id="typeId"
              value={filters.typeId}
              onChange={(e) => handleInputChange('typeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tümü</option>
              {requestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            {showAdvanced ? 'Gelişmiş Filtreleri Gizle' : 'Gelişmiş Filtreler'}
          </button>
          
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">

            <div>
              <label htmlFor="creatorId" className="block text-sm font-medium text-gray-700 mb-1">
                Talep Eden
              </label>
              <select
                id="creatorId"
                value={filters.creatorId}
                onChange={(e) => handleInputChange('creatorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tümü</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="supportProviderId" className="block text-sm font-medium text-gray-700 mb-1">
                Destek Sağlayıcı
              </label>
              <select
                id="supportProviderId"
                value={filters.supportProviderId}
                onChange={(e) => handleInputChange('supportProviderId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tümü</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sıralama
              </label>
              <div className="flex space-x-2">
                <select
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="createdDate">Oluşturma Tarihi</option>
                  <option value="modifiedDate">Değiştirilme Tarihi</option>
                  <option value="description">Açıklama</option>
                  <option value="id">ID</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="desc">Azalan</option>
                  <option value="asc">Artan</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestFilters;
