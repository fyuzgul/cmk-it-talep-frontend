import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import { useUsers } from '../../hooks/useUsers';
import { useRequestResponses } from '../../hooks/useRequestResponses';

// Sortable Request Card Component
const SortableRequestCard = ({ request, requestTypes, requestStatuses, onViewRequest }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case 'yeni':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'işlemde':
        return 'bg-yellow-800 text-yellow-800 border-yellow-200';
      case 'tamamlandı':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reddedildi':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'beklemede':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBorderClass = (statusId) => {
    switch (statusId) {
      case 1: // Yeni
        return 'border-l-gray-400';
      case 2: // Beklemede
        return 'border-l-blue-400';
      case 3: // İşlemde
        return 'border-l-yellow-400';
      case 4: // Çözüldü
        return 'border-l-green-500';
      case 5: // Kapalı
        return 'border-l-red-500';
      default:
        return 'border-l-gray-400';
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeName = (typeId) => {
    const type = requestTypes.find(t => t.id === typeId);
    return type?.name || 'Bilinmiyor';
  };

  const getStatusName = (statusId) => {
    const status = requestStatuses.find(s => s.id === statusId);
    return status?.name || 'Bilinmiyor';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`kanban-card bg-white rounded-lg shadow-sm border-l-4 ${getStatusBorderClass(request.requestStatusId)} border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:scale-105 touch-manipulation`}
    >
      {/* Mobile-friendly Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-xs font-medium text-gray-900 line-clamp-2 mb-2">
            {request.description}
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            <span className="text-xs text-gray-500">
              {getTypeName(request.requestTypeId)}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(getStatusName(request.requestStatusId))}`}>
              {getStatusName(request.requestStatusId)}
            </span>
          </div>
        </div>
        
        {/* Mobile Drag Handle - Larger touch target */}
        <div 
          {...listeners}
          className="cursor-move p-2 -m-2 touch-manipulation flex-shrink-0"
          style={{ minWidth: '44px', minHeight: '44px' }} // iOS/Android minimum touch target
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
      
      {/* Mobile-friendly Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            <span className="font-medium text-xs truncate">
              {request.requestCreator?.firstName} {request.requestCreator?.lastName}
            </span>
          </div>
          <span className="text-xs flex-shrink-0 ml-2">{formatDate(request.createdDate)}</span>
        </div>
        
        {request.supportProvider && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Destek:</span> {request.supportProvider.firstName} {request.supportProvider.lastName}
            </div>
          </div>
        )}
        
        {/* Mobile-friendly Action Button */}
        <button
          onClick={() => onViewRequest(request)}
          className="w-full mt-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200 touch-manipulation"
        >
          Cevap Ver →
        </button>
      </div>
    </div>
  );
};

// Status Column Component
const StatusColumn = ({ status, requests, requestTypes, requestStatuses, onViewRequest }) => {
  const sortableIds = requests.map(request => request.id);
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status.id}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-3 sm:p-4 min-h-[300px] sm:min-h-[500px] transition-colors duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{status.name}</h3>
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2">
          {requests.length}
        </span>
      </div>
      
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 sm:space-y-2 min-h-[250px] sm:min-h-[400px]">
          {requests.map((request) => (
            <SortableRequestCard 
              key={request.id} 
              request={request} 
              requestTypes={requestTypes}
              requestStatuses={requestStatuses}
              onViewRequest={onViewRequest}
            />
          ))}
          {requests.length === 0 && (
            <div className={`text-center py-8 sm:py-6 text-gray-400 text-xs border-2 border-dashed rounded-lg transition-colors duration-200 ${
              isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}>
              <div className="mb-2">
                <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Bu durumda talep bulunmuyor
              <br />
              <span className="text-xs">Talepleri buraya sürükleyin</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};


// Main Request Method Component
const SupportKanbanBoard = ({ onRequestSelect, onTabChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    requests,
    requestTypes,
    requestStatuses,
    fetchRequests,
    fetchRequestsWithPagination,
    updateRequest,
    loading,
    error
  } = useRequests();

  const { users } = useUsers();

  const {
    getRequestResponsesByRequestId, 
    createRequestResponse, 
    loading: responseLoading 
  } = useRequestResponses();

  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    typeId: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start drag
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100, // Delay for touch devices
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load requests for support users with pagination
  const loadRequests = useCallback(async () => {
    try {
      await fetchRequestsWithPagination({
        supportProviderId: user?.id,
        page: 1,
        pageSize: 50 // Optimized page size for better performance
      });
    } catch (error) {
      // Console log removed
    }
  }, [user?.id, fetchRequestsWithPagination]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filters.search && !request.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.typeId && request.requestTypeId !== parseInt(filters.typeId)) {
      return false;
    }
    return true;
  });

  // Group requests by status
  const requestsByStatus = requestStatuses.map(status => ({
    ...status,
    requests: filteredRequests.filter(request => request.requestStatusId === status.id)
  }));

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    const activeRequest = requests.find(req => req.id === active.id);
    
    // Check if dropped on a status column (drop zone)
    let targetStatusId = null;
    
    if (over.id.toString().startsWith('status-')) {
      // Dropped on a status column
      targetStatusId = parseInt(over.id.toString().replace('status-', ''));
    } else {
      // Dropped on a request card, find its status
      const targetRequest = requests.find(req => req.id === over.id);
      if (targetRequest) {
        targetStatusId = targetRequest.requestStatusId;
      }
    }

    if (!activeRequest || !targetStatusId) {
      return;
    }

    // Don't update if the status is the same
    if (activeRequest.requestStatusId === targetStatusId) {
      return;
    }

    // Update request status and assign to current support user
    try {
      const targetStatus = requestStatuses.find(s => s.id === targetStatusId);
      
      // Prepare complete request data for API
      const updatedRequestData = {
        id: activeRequest.id,
        description: activeRequest.description,
        screenshotFilePath: activeRequest.screenshotFilePath || null,
        supportProviderId: user.id, // Assign to current support user
        requestCreatorId: activeRequest.requestCreatorId,
        requestStatusId: targetStatusId, // New status
        requestTypeId: activeRequest.requestTypeId,
        response: activeRequest.response || null,
        createdDate: activeRequest.createdDate,
        modifiedDate: new Date().toISOString()
      };
      
      // Console log removed
      await updateRequest(activeRequest.id, updatedRequestData);
      await loadRequests(); // Refresh the list
      
      // Show success notification
      toast.success(`Talep "${activeRequest.description.substring(0, 30)}..." durumu "${targetStatus?.name}" olarak güncellendi ve size atandı.`);
    } catch (error) {
      // Console log removed
      toast.error('Talep durumu güncellenirken bir hata oluştu.');
    }
  };


  const handleUpdateRequest = async (requestId, requestData) => {
    try {
      await updateRequest(requestId, requestData);
      await loadRequests();
      toast.success('Talep başarıyla güncellendi.');
    } catch (error) {
      // Console log removed
      toast.error('Talep güncellenirken bir hata oluştu.');
      throw error;
    }
  };

  const handleViewRequest = async (request) => {
    // Navigate to message management with the selected request
    // Console log removed
    
    // Set the selected request ID in parent component
    if (onRequestSelect) {
      onRequestSelect(request.id);
    }
    
    // Change tab to message management
    if (onTabChange) {
      onTabChange('messageManagement');
    }
  };



  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Talep Yöntemi</h2>
        <p className="text-xs sm:text-sm text-gray-600">Talepleri sürükleyip bırakarak durumlarını değiştirebilirsiniz</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Mobile-optimized Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Talep açıklamasında ara..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Talep Türü
            </label>
            <select
              value={filters.typeId}
              onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
            >
              <option value="">Tüm Türler</option>
              {requestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Mobile: Single column, Desktop: Multiple columns */}
        <div className="kanban-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {requestsByStatus.map((statusData) => (
            <StatusColumn
              key={statusData.id}
              status={statusData}
              requests={statusData.requests}
              requestTypes={requestTypes}
              requestStatuses={requestStatuses}
              onViewRequest={handleViewRequest}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg shadow-lg border-l-4 border-indigo-500 border border-gray-200 p-3 sm:p-4 cursor-move opacity-90 transform rotate-2 max-w-xs">
              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                {requests.find(req => req.id === activeId)?.description}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mobile Help Text */}
      <div className="mt-4 sm:hidden bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">📱 Mobil Kullanım Rehberi:</p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">1.</span>
                <div>
                  <p className="font-medium">Sürükleme:</p>
                  <p className="text-xs">Kartın sağ üst köşesindeki çizgili icon'a dokunup basılı tutun, sonra farklı sütuna sürükleyin</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">2.</span>
                <div>
                  <p className="font-medium">Detay Görünümü:</p>
                  <p className="text-xs">"Cevap Ver" butonuna dokunarak talep detaylarına geçin</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">3.</span>
                <div>
                  <p className="font-medium">Durum Değiştirme:</p>
                  <p className="text-xs">Kartları farklı renkli sütunlara sürükleyerek durumlarını güncelleyin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportKanbanBoard;
