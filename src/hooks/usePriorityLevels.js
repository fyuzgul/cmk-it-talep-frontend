import { useState, useEffect } from 'react';
import { commonAPI } from '../services/api';

export const usePriorityLevels = () => {
  const [priorityLevels, setPriorityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPriorityLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commonAPI.getPriorityLevels();
      setPriorityLevels(data);
    } catch (err) {
      setError(err.message);
      // Console log removed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorityLevels();
  }, []);

  const createPriorityLevel = async (priorityLevelData) => {
    try {
      const newPriorityLevel = await commonAPI.createPriorityLevel(priorityLevelData);
      setPriorityLevels(prev => [...prev, newPriorityLevel]);
      return newPriorityLevel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePriorityLevel = async (id, priorityLevelData) => {
    try {
      const updatedPriorityLevel = await commonAPI.updatePriorityLevel(id, priorityLevelData);
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
      await commonAPI.deletePriorityLevel(id);
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
