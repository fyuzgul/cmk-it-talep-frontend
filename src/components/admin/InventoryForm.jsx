import React, { useState, useEffect } from 'react';
import { commonAPI } from '../../services/api';
import { 
  XMarkIcon, 
  ComputerDesktopIcon,
  UserIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  WifiIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const InventoryForm = ({ inventory, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    no: '',
    department: '',
    fullName: '',
    username: '',
    domain: '',
    computerName: '',
    computerModel: '',
    serialNumber: '',
    operatingSystem: '',
    licenseTag: '',
    office: '',
    officeLicense: '',
    processor: '',
    ram: '',
    ssd: '',
    hdd: '',
    ethernetIp: '',
    ethernetMac: '',
    wifiIp: '',
    wifiMac: '',
    antivirus: '',
    installedPrograms: '',
    monitorModel: '',
    monitorSerialNumber: '',
    accessories: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showPasswords, setShowPasswords] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const tabs = [
    { id: 'basic', name: 'Temel Bilgiler', shortName: 'Temel', icon: UserIcon },
    { id: 'computer', name: 'Bilgisayar', shortName: 'PC', icon: ComputerDesktopIcon },
    { id: 'software', name: 'Yazılım', shortName: 'Yazılım', icon: CpuChipIcon },
    { id: 'network', name: 'Ağ', shortName: 'Ağ', icon: WifiIcon },
    { id: 'security', name: 'Güvenlik', shortName: 'Güvenlik', icon: ShieldCheckIcon },
    { id: 'other', name: 'Diğer', shortName: 'Diğer', icon: BuildingOfficeIcon }
  ];

  useEffect(() => {
    // Fetch departments
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await commonAPI.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();

    if (inventory) {
      setFormData({
        no: inventory.no || '',
        department: inventory.department || '',
        fullName: inventory.fullName || '',
        username: inventory.username || '',
        domain: inventory.domain || '',
        computerName: inventory.computerName || '',
        computerModel: inventory.computerModel || '',
        serialNumber: inventory.serialNumber || '',
        operatingSystem: inventory.operatingSystem || '',
        licenseTag: inventory.licenseTag || '',
        office: inventory.office || '',
        officeLicense: inventory.officeLicense || '',
        processor: inventory.processor || '',
        ram: inventory.ram || '',
        ssd: inventory.ssd || '',
        hdd: inventory.hdd || '',
        ethernetIp: inventory.ethernetIp || '',
        ethernetMac: inventory.ethernetMac || '',
        wifiIp: inventory.wifiIp || '',
        wifiMac: inventory.wifiMac || '',
        antivirus: inventory.antivirus || '',
        installedPrograms: inventory.installedPrograms || '',
        monitorModel: inventory.monitorModel || '',
        monitorSerialNumber: inventory.monitorSerialNumber || '',
        accessories: inventory.accessories || ''
      });
    }
  }, [inventory]);

  const validateForm = () => {
    const newErrors = {};

    // Sadece temel alanlar zorunlu
    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Ad Soyad gereklidir';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Departman gereklidir';
    }

    setErrors(newErrors);
    console.log('Validation errors:', newErrors);
    console.log('Validation passed:', Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const isValidIP = (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const isValidMAC = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submit triggered', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, submitting...');
    setIsSubmitting(true);
    try {
      console.log('Calling onSubmit with data:', formData);
      await onSubmit(formData);
      console.log('Form submitted successfully');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="no"
                  value={formData.no}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.no ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Envanter numarası"
                />
                {errors.no && <p className="mt-1 text-sm text-red-600">{errors.no}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departman <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loadingDepartments}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  } ${loadingDepartments ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {loadingDepartments ? 'Departmanlar yükleniyor...' : 'Departman seçiniz'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ad Soyad"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Kullanıcı adı"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Domain adı"
                />
              </div>
            </div>
          </div>
        );

      case 'computer':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bilgisayar Adı</label>
                <input
                  type="text"
                  name="computerName"
                  value={formData.computerName}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Bilgisayar adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bilgisayar Model</label>
                <input
                  type="text"
                  name="computerModel"
                  value={formData.computerModel}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seri No</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Seri numarası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İşletim Sistemi</label>
                <input
                  type="text"
                  name="operatingSystem"
                  value={formData.operatingSystem}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="İşletim sistemi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lisans Etiketi</label>
                <input
                  type="text"
                  name="licenseTag"
                  value={formData.licenseTag}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Lisans etiketi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İşlemci</label>
                <input
                  type="text"
                  name="processor"
                  value={formData.processor}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="İşlemci modeli"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RAM</label>
                <input
                  type="text"
                  name="ram"
                  value={formData.ram}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="RAM miktarı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SSD</label>
                <input
                  type="text"
                  name="ssd"
                  value={formData.ssd}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="SSD kapasitesi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HDD</label>
                <input
                  type="text"
                  name="hdd"
                  value={formData.hdd}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="HDD kapasitesi"
                />
              </div>
            </div>
          </div>
        );

      case 'software':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Office</label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Office sürümü"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Office Lisans</label>
                <input
                  type="text"
                  name="officeLicense"
                  value={formData.officeLicense}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Lisans numarası"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kurulu Programlar</label>
                <textarea
                  name="installedPrograms"
                  value={formData.installedPrograms}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Kurulu programları listeleyin..."
                />
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ethernet IP</label>
                <input
                  type="text"
                  name="ethernetIp"
                  value={formData.ethernetIp}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.ethernetIp ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="192.168.1.100"
                />
                {errors.ethernetIp && <p className="mt-1 text-sm text-red-600">{errors.ethernetIp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ethernet MAC</label>
                <input
                  type="text"
                  name="ethernetMac"
                  value={formData.ethernetMac}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.ethernetMac ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="00:1A:2B:3C:4D:5E"
                />
                {errors.ethernetMac && <p className="mt-1 text-sm text-red-600">{errors.ethernetMac}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WiFi IP</label>
                <input
                  type="text"
                  name="wifiIp"
                  value={formData.wifiIp}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.wifiIp ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="192.168.1.101"
                />
                {errors.wifiIp && <p className="mt-1 text-sm text-red-600">{errors.wifiIp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WiFi MAC</label>
                <input
                  type="text"
                  name="wifiMac"
                  value={formData.wifiMac}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.wifiMac ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="00:1A:2B:3C:4D:5F"
                />
                {errors.wifiMac && <p className="mt-1 text-sm text-red-600">{errors.wifiMac}</p>}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antivirus</label>
                <input
                  type="text"
                  name="antivirus"
                  value={formData.antivirus}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Antivirus programı"
                />
              </div>
            </div>
          </div>
        );

      case 'other':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ekran Model</label>
                <input
                  type="text"
                  name="monitorModel"
                  value={formData.monitorModel}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Ekran modeli"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ekran Seri No</label>
                <input
                  type="text"
                  name="monitorSerialNumber"
                  value={formData.monitorSerialNumber}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Ekran seri numarası"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Aksesuarlar</label>
                <textarea
                  name="accessories"
                  value={formData.accessories}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Aksesuarları listeleyin (klavye, mouse, webcam vb.)"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                <ComputerDesktopIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">
                  {inventory ? 'Envanter Düzenle' : 'Yeni Envanter Ekle'}
                </h2>
                <p className="text-blue-100 text-sm sm:text-base hidden sm:block">
                  {inventory ? 'Mevcut envanter bilgilerini güncelleyin' : 'Yeni envanter kaydı oluşturun'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 px-2 sm:px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.shortName}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Form Content */}
          <div className="p-3 sm:p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4 sm:space-y-6">
              {renderTabContent()}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{inventory ? 'Güncelle' : 'Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;