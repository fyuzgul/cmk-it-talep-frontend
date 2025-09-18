import { useState, useEffect } from 'react';
import priorityLevelService from '../services/priorityLevelService';

export const usePriorityLevels = () => {
  const [priorityLevels, setPriorityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPriorityLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await priorityLevelService.getAll();
      setPriorityLevels(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching priority levels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorityLevels();
  }, []);

  const createPriorityLevel = async (priorityLevelData) => {
    try {
      const newPriorityLevel = await priorityLevelService.create(priorityLevelData);
      setPriorityLevels(prev => [...prev, newPriorityLevel]);
      return newPriorityLevel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePriorityLevel = async (id, priorityLevelData) => {
    try {
      const updatedPriorityLevel = await priorityLevelService.update(id, priorityLevelData);
      setPriorityLevels(prev => 
        prev.map(level => level.id === id ? updatedPriorityLevel : level)
      );
      return updatedPriorityLevel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deletePriorityLevel = async (id) => {
    try {
      await priorityLevelService.delete(id);
      setPriorityLevels(prev => prev.filter(level => level.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    priorityLevels,
    loading,
    error,
    fetchPriorityLevels,
    createPriorityLevel,
    updatePriorityLevel,
    deletePriorityLevel
  };
};
