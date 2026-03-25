import { create } from 'zustand'
import api from '../utils/api'

export const useLeadStore = create((set, get) => ({
  leads: [],
  total: 0,
  loading: false,
  filters: {},

  fetchLeads: async (params = {}) => {
    set({ loading: true })
    try {
      const data = await api.get('/leads', { params })
      set({ leads: data.data, total: data.total, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createLead: async (leadData) => {
    const data = await api.post('/leads', leadData)
    set(state => ({ leads: [...state.leads, data] }))
    return data
  },

  updateLead: async (id, leadData) => {
    const data = await api.put(`/leads/${id}`, leadData)
    set(state => ({
      leads: state.leads.map(lead => lead.id === id ? data : lead)
    }))
    return data
  },

  deleteLead: async (id) => {
    await api.delete(`/leads/${id}`)
    set(state => ({ leads: state.leads.filter(lead => lead.id !== id) }))
  },

  bulkUpdate: async (ids, data) => {
    await api.post('/leads/bulk/update', { ids, data })
    get().fetchLeads()
  },

  setFilters: (filters) => {
    set({ filters })
  }
}))
