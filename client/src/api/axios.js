import axios from 'axios'
import { toast } from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config || {}

    const canRetryNetworkGet = !error?.response
      && config?.method === 'get'
      && !config.__retriedOnce

    if (canRetryNetworkGet) {
      config.__retriedOnce = true
      if (!config?.skipGlobalErrorToast) {
        toast.error('Error de red al cargar datos, reintentando...')
      }
      return api(config)
    }

    if (!config?.skipGlobalErrorToast) {
      const backendMessage = error?.response?.data?.message
      const validationMessage = error?.response?.data?.data?.[0]?.msg
      const fallbackMessage = error?.response
        ? 'No se pudo completar la solicitud.'
        : 'No hay conexion con el servidor.'

      toast.error(validationMessage || backendMessage || fallbackMessage)
    }

    return Promise.reject(error)
  },
)

export default api
