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
      setItems([]);
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
      setItems((p) => p.map((it) => (it.id === tempId ? { ...payload, id: Date.now() } : it)));
      return { ok: true, offline: true };
    }
  };

  const updateItem = async (id, patch) => {
    setItems((p) => p.map((it) => (it.id === id || it._id === id ? { ...it, ...patch } : it)));
    try { await inventoryService.update(id, patch); return { ok: true }; }
    catch (err) { return { ok: true, offline: true }; }
  };

  const consumeItem = async (id) => {
    setItems((p) => p.map((it) => (it.id === id || it._id === id ? { ...it, status: 'consumed' } : it)));
    try { await inventoryService.consume(id); await fetchItems(); return { ok: true }; }
    catch (err) { await fetchItems(); return { ok: false, error: err.message }; }
  };

  const removeItem = async (id) => {
    setItems((p) => p.filter((it) => it.id !== id && it._id !== id));
    try { await inventoryService.remove(id); await fetchItems(); return { ok: true }; }
    catch (err) { await fetchItems(); return { ok: false, error: err.message }; }
  };

  return (
    <InventoryContext.Provider
      value={{ items, loading, error, refresh: fetchItems, addItem, updateItem, consumeItem, removeItem }}
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
