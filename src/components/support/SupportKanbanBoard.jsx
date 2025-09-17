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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      className={`kanban-card bg-white rounded-lg shadow-sm border-l-4 border-l-gray-500 border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:scale-105`}
    >
      {/* Drag Handle */}
      <div 
        {...listeners}
        className="cursor-move flex items-center justify-between mb-1"
      >
        <div className="flex-1">
          <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
            {request.description}
          </h4>
          <p className="text-xs text-gray-500 mb-1">
            {getTypeName(request.requestTypeId)}
          </p>
        </div>
        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(getStatusName(request.requestStatusId))}`}>
          {getStatusName(request.requestStatusId)}
        </span>
      </div>
      
      {/* Clickable Area for Response */}
      <div 
        className="p-1 cursor-pointer hover:bg-gray-50 rounded transition-colors duration-200"
        onClick={() => onViewRequest(request)}
      >
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-xs">
              {request.requestCreator?.firstName} {request.requestCreator?.lastName}
            </span>
          </div>
          <span className="text-xs">{formatDate(request.createdDate)}</span>
        </div>
        
        {request.supportProvider && (
          <div className="mt-1 pt-1 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Destek:</span> {request.supportProvider.firstName} {request.supportProvider.lastName}
            </div>
          </div>
        )}
        
        <div className="mt-1 text-xs text-indigo-600 font-medium">
          Cevap ver →
        </div>
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
      className={`bg-gray-50 rounded-lg p-3 min-h-[500px] transition-colors duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{status.name}</h3>
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
          {requests.length}
        </span>
      </div>
      
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[400px]">
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
            <div className={`text-center py-6 text-gray-400 text-xs border-2 border-dashed rounded-lg transition-colors duration-200 ${
              isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}>
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
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load requests for support users
  const loadRequests = useCallback(async () => {
    try {
      await fetchRequests({
        supportProviderId: user?.id,
        pageSize: 100 // Get more requests for kanban view
      });
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }, [user?.id, fetchRequests]);

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
      
      console.log('Updating request with data:', updatedRequestData);
      await updateRequest(activeRequest.id, updatedRequestData);
      await loadRequests(); // Refresh the list
      
      // Show success notification
      toast.success(`Talep "${activeRequest.description.substring(0, 30)}..." durumu "${targetStatus?.name}" olarak güncellendi ve size atandı.`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Talep durumu güncellenirken bir hata oluştu.');
    }
  };


  const handleUpdateRequest = async (requestId, requestData) => {
    try {
      await updateRequest(requestId, requestData);
      await loadRequests();
      toast.success('Talep başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Talep güncellenirken bir hata oluştu.');
      throw error;
    }
  };

  const handleViewRequest = async (request) => {
    // Navigate to message management with the selected request
    console.log('🚀 Navigating to message management with request:', request);
    
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
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Talep Yöntemi</h2>
        <p className="text-sm text-gray-600">Talepleri sürükleyip bırakarak durumlarını değiştirebilirsiniz</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Talep açıklamasında ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Talep Türü
            </label>
            <select
              value={filters.typeId}
              onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3">
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
            <div className="bg-white rounded-lg shadow-lg border-l-4 border-indigo-500 border border-gray-200 p-4 cursor-move opacity-90 transform rotate-2">
              <div className="text-sm font-medium text-gray-900">
                {requests.find(req => req.id === activeId)?.description}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>


    </div>
  );
};

export default SupportKanbanBoard;
