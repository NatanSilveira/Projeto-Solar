import React, { createContext, useContext, useState, useEffect } from 'react';
import { ExpirationRecord, Product, RiskLevel, FormTemplate, FormResponse, User, MaterialRequest, Store } from '../types';
import { differenceInDays, parseISO } from 'date-fns';
import { useAuth } from './AuthContext';

interface DataContextType {
  products: Product[];
  expirations: ExpirationRecord[];
  formTemplates: FormTemplate[];
  formResponses: FormResponse[];
  team: User[];
  requests: MaterialRequest[];
  stores: Store[];
  addExpiration: (record: Omit<ExpirationRecord, 'id' | 'riskLevel' | 'recordedAt'>) => void;
  updateExpiration: (id: string, updates: Partial<ExpirationRecord>) => Promise<void>;
  deleteExpiration: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  addFormTemplate: (template: Omit<FormTemplate, 'id' | 'createdAt' | 'lastUpdated' | 'responsesCount'>) => Promise<void>;
  deleteFormTemplate: (id: string) => Promise<void>;
  addFormResponse: (response: Omit<FormResponse, 'id' | 'submittedAt'>) => Promise<void>;
  addRequest: (request: Omit<MaterialRequest, 'id' | 'status' | 'date'>) => Promise<void>;
  updateRequestStatus: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => Promise<void>;
  updateUserStatus: (id: string, status: User['status']) => Promise<void>;
  editUser: (id: string, name: string, email: string) => Promise<void>;
  resetUserPassword: (id: string, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addTeamMember: (member: User) => void;
  addStore: (store: Omit<Store, 'id'>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  calculateRisk: (expirationDate: string, quantity: number, dailyGiro: number) => RiskLevel;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [expirations, setExpirations] = useState<ExpirationRecord[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    // Fetch initial data from API
    const fetchData = async () => {
      try {
        const queryParams = user?.role === 'supervisor' ? `?supervisorId=${user.id}` : user?.role === 'promoter' ? `?promoterId=${user.id}` : '';
        const formsQuery = user?.role === 'supervisor' ? `?supervisorId=${user.id}` : user?.role === 'promoter' ? `?promoterId=${user.id}` : '';
        const [productsRes, expirationsRes, formsRes, responsesRes, teamRes, requestsRes, storesRes] = await Promise.all([
          fetch('/api/products'),
          fetch(`/api/expirations${queryParams}`),
          fetch(`/api/forms${formsQuery}`),
          fetch(`/api/form-responses${queryParams}`),
          fetch(`/api/team${queryParams}`),
          fetch(`/api/requests${queryParams}`),
          fetch(`/api/stores${queryParams}`)
        ]);

        const [pData, eData, fData, rData, tData, reqData, sData] = await Promise.all([
          productsRes.json(),
          expirationsRes.json(),
          formsRes.json(),
          responsesRes.json(),
          teamRes.json(),
          requestsRes.json(),
          storesRes.json()
        ]);

        setProducts(Array.isArray(pData) ? pData : []);
        setExpirations(Array.isArray(eData) ? eData : []);
        setFormTemplates(Array.isArray(fData) ? fData : []);
        setFormResponses(Array.isArray(rData) ? rData : []);
        setTeam(Array.isArray(tData) ? tData : []);
        setStores(Array.isArray(sData) ? sData : []);
        
        // Map DB fields to camelCase if necessary (material_requests has store_name, promoter_id, created_at)
        if (Array.isArray(reqData)) {
          const mappedRequests = reqData.map(r => ({
            id: r.id,
            type: r.type,
            store: r.store_name,
            status: r.status,
            date: r.created_at,
            description: r.description,
            promoterId: r.promoter_id,
            rejectionReason: r.rejection_reason
          }));
          setRequests(mappedRequests);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };

    fetchData();
  }, [user]);

  const calculateRisk = (expirationDate: string, quantity: number, dailyGiro: number): RiskLevel => {
    const today = new Date();
    const expDate = parseISO(expirationDate);
    const daysToExpire = differenceInDays(expDate, today);
    const daysOfStock = quantity / (dailyGiro || 1); // Prevent division by zero

    if (daysOfStock >= daysToExpire) return 'CRITICAL';
    if (daysToExpire - daysOfStock <= 7) return 'WARNING';
    return 'SAFE';
  };

  const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
    };

    // Optimistic update
    setProducts(prev => [...prev, newProduct]);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      
      return newProduct;
    } catch (error) {
      console.error("Failed to save product to database", error);
      // Revert optimistic update on error
      setProducts(prev => prev.filter(p => p.id !== newProduct.id));
      throw error;
    }
  };

  const addExpiration = async (record: Omit<ExpirationRecord, 'id' | 'riskLevel' | 'recordedAt'>) => {
    const newRecord: ExpirationRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      riskLevel: calculateRisk(record.expirationDate, record.quantity, record.dailyGiro),
      recordedAt: new Date().toISOString()
    };

    // Optimistic update
    setExpirations(prev => [newRecord, ...prev]);

    try {
      await fetch('/api/expirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
    } catch (error) {
      console.error("Failed to save expiration to database", error);
    }
  };

  const updateExpiration = async (id: string, updates: Partial<ExpirationRecord>) => {
    setExpirations(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      await fetch(`/api/expirations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error("Failed to update expiration", error);
    }
  };

  const deleteExpiration = async (id: string) => {
    setExpirations(prev => prev.filter(e => e.id !== id));
    try {
      await fetch(`/api/expirations/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error("Failed to delete expiration", error);
    }
  };

  const addFormTemplate = async (template: Omit<FormTemplate, 'id' | 'createdAt' | 'lastUpdated' | 'responsesCount'>) => {
    const now = new Date().toISOString();
    const newTemplate: FormTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: now,
      lastUpdated: now,
      responsesCount: 0,
      supervisorId: user?.role === 'supervisor' ? user.id : undefined
    };

    setFormTemplates(prev => [newTemplate, ...prev]);

    try {
      await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
    } catch (error) {
      console.error("Failed to create form template", error);
    }
  };

  const deleteFormTemplate = async (id: string) => {
    const prevForms = [...formTemplates];
    setFormTemplates(prev => prev.filter(f => f.id !== id));
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Failed to delete form");
    } catch (error) {
      console.error("Failed to delete form template", error);
      alert("Erro ao excluir formulário.");
      setFormTemplates(prevForms);
    }
  };

  const addFormResponse = async (response: Omit<FormResponse, 'id' | 'submittedAt'>) => {
    const newResponse: FormResponse = {
      ...response,
      id: Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString()
    };

    setFormResponses(prev => [newResponse, ...prev]);

    try {
      await fetch('/api/form-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResponse)
      });
    } catch (error) {
      console.error("Failed to submit form response", error);
    }
  };

  const addRequest = async (request: Omit<MaterialRequest, 'id' | 'status' | 'date'>) => {
    const newRequest: MaterialRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      date: new Date().toISOString()
    };

    setRequests(prev => [newRequest, ...prev]);

    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newRequest.id,
          type: newRequest.type,
          store_name: newRequest.store,
          status: newRequest.status,
          description: newRequest.description,
          promoter_id: newRequest.promoterId,
          created_at: newRequest.date
        })
      });
    } catch (error) {
      console.error("Failed to create request", error);
    }
  };

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, rejectionReason } : r));
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });
    } catch (error) {
      console.error("Failed to update request status", error);
    }
  };

  const updateUserStatus = async (id: string, status: User['status']) => {
    setTeam(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    try {
      await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error("Failed to update user status", error);
    }
  };

  const editUser = async (id: string, name: string, email: string) => {
    setTeam(prev => prev.map(u => u.id === id ? { ...u, name, email } : u));
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
    } catch (error) {
      console.error("Failed to edit user", error);
    }
  };

  const resetUserPassword = async (id: string, password: string) => {
    try {
      await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
    } catch (error) {
      console.error("Failed to reset password", error);
    }
  };

  const deleteUser = async (id: string) => {
    const previousTeam = [...team];
    setTeam(prev => prev.filter(u => u.id !== id));
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao excluir usuário');
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Erro ao excluir promotor. Tente novamente.");
      setTeam(previousTeam);
    }
  };

  const addTeamMember = (member: User) => {
    setTeam(prev => [...prev, member]);
  };

  const addStore = async (store: Omit<Store, 'id'>) => {
    const newStore: Store = {
      ...store,
      id: Math.random().toString(36).substr(2, 9),
    };
    setStores(prev => [...prev, newStore]);
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
      });
      if (!response.ok) throw new Error('Falha ao adicionar loja');
    } catch (error) {
      console.error("Failed to add store", error);
      setStores(prev => prev.filter(s => s.id !== newStore.id));
      alert("Erro ao adicionar loja.");
    }
  };

  const deleteStore = async (id: string) => {
    const previousStores = [...stores];
    setStores(prev => prev.filter(s => s.id !== id));
    try {
      const response = await fetch(`/api/stores/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao excluir loja');
    } catch (error) {
      console.error("Failed to delete store", error);
      alert("Erro ao excluir loja. Tente novamente.");
      setStores(previousStores);
    }
  };

  return (
    <DataContext.Provider value={{ 
      products, 
      expirations, 
      formTemplates, 
      formResponses,
      team,
      requests,
      stores,
      addExpiration, 
      updateExpiration,
      deleteExpiration,
      addProduct,
      addFormTemplate,
      deleteFormTemplate,
      addFormResponse,
      addRequest,
      updateRequestStatus,
      updateUserStatus,
      editUser,
      resetUserPassword,
      deleteUser,
      addTeamMember,
      addStore,
      deleteStore,
      calculateRisk 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
