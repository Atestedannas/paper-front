import { defineStore } from 'pinia'
import {
  deletePaper,
  getPaperById,
  getPapers,
  uploadPaper
} from '../api/paper'

export const usePaperStore = defineStore('paper', {
  state: () => ({
    papers: [],
    currentPaper: null,
    uploadProgress: 0,
    loading: false
  }),

  actions: {
    async upload(file) {
      this.loading = true
      this.uploadProgress = 0
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await uploadPaper(formData, (progressEvent) => {
          this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        })

        this.papers.unshift(response.data)
        this.currentPaper = response.data
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPapers() {
      this.loading = true
      try {
        const response = await getPapers()
        this.papers = response.data
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPaperById(id) {
      this.loading = true
      try {
        const response = await getPaperById(id)
        this.currentPaper = response.data
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async removePaper(id) {
      this.loading = true
      try {
        await deletePaper(id)
        this.papers = this.papers.filter(paper => paper.id !== id)
        if (this.currentPaper && this.currentPaper.id === id) {
          this.currentPaper = null
        }
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
