import axios from 'axios';

const isProduction = import.meta.env.MODE === 'production';
const productionApiUrl = 'https://platform-creative.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isProduction ? productionApiUrl : '/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.response.use(
    (response) => {
        const contentType = response?.headers?.['content-type'] || '';
        const rawData = typeof response?.data === 'string' ? response.data : '';
        const looksLikeHtml = rawData.trim().toLowerCase().startsWith('<!doctype');
        const isHtmlHeader = contentType.toLowerCase().includes('text/html');

        if (looksLikeHtml || isHtmlHeader) {
            const message =
                '[API Error] Se recibió HTML en lugar de JSON. Posible error de ruta o redirección en Render.';
            console.error(message);
            throw new Error(message);
        }

        return response;
    },
    (error) => {
        const contentType = error?.response?.headers?.['content-type'] || '';
        const rawData = typeof error?.response?.data === 'string' ? error.response.data : '';
        const looksLikeHtml = rawData.trim().toLowerCase().startsWith('<!doctype');
        const isHtmlHeader = contentType.toLowerCase().includes('text/html');

        if (looksLikeHtml || isHtmlHeader) {
            const message =
                '[API Error] Se recibió HTML en lugar de JSON. Posible error de ruta o redirección en Render.';
            console.error(message);
            return Promise.reject(new Error(message));
        }

        return Promise.reject(error);
    }
);

export async function getSubjects() {
    try {
        const res = await api.get('/subjects');
        return res.data;
    } catch (error) {
        console.error('Error fetching subjects:', error);
        throw error;
    }
}

export async function getLevels(subjectId) {
    try {
        const res = await api.get(`/subjects/${subjectId}/levels`);
        return res.data;
    } catch (error) {
        console.error('Error fetching levels:', error);
        throw error;
    }
}

export async function getUnits(levelId) {
    try {
        const res = await api.get(`/levels/${levelId}/units`);
        return res.data;
    } catch (error) {
        console.error('Error fetching units:', error);
        throw error;
    }
}

export async function getLessons(unitId) {
    try {
        const res = await api.get(`/units/${unitId}/lessons`);
        return res.data;
    } catch (error) {
        console.error('Error fetching lessons:', error);
        throw error;
    }
}

export async function getLessonById(lessonId) {
    try {
        const res = await api.get(`/lessons/${lessonId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching lesson detail:', error);
        throw error;
    }
}

export async function saveProgress(data) {
    try {
        const res = await api.post('/progress', data);
        return res.data;
    } catch (error) {
        console.error('Error saving progress:', error);
        throw error;
    }
}

export default api;
