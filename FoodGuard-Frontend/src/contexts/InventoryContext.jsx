import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import inventoryService from '../services/inventory.service';
import { useAuth } from './AuthContext';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!isAuthenticated) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const data = await inventoryService.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setItems([]); // no hardcoded fallback — show only the user's own data
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchItems();
    else setItems([]);
  }, [isAuthenticated, fetchItems]);

  const addItem = async (payload) => {
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { ...payload, id: tempId };
    setItems((p) => [optimistic, ...p]);
    try {
      const created = await inventoryService.create(payload);
      setItems((p) => p.map((it) => (it.id === tempId ? (created || { ...payload, id: tempId }) : it)));
      return { ok: true };
    } catch (err) {
      // Keep locally so user's entry is visible even if backend is down
      setItems((p) => p.map((it) => (it.id === tempId ? { ...payload, id: Date.now() } : it)));
      return { ok: true, offline: true };
    }
  };

  const updateItem = async (id, patch) => {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try { await inventoryService.update(id, patch); return { ok: true }; }
    catch (err) { return { ok: true, offline: true }; }
  };

  const removeItem = async (id) => {
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== id));
    try { await inventoryService.remove(id); return { ok: true }; }
    catch (err) { return { ok: true, offline: true }; }
  };

  return (
    <InventoryContext.Provider
      value={{ items, loading, error, refresh: fetchItems, addItem, updateItem, removeItem }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>');
  return ctx;
}
