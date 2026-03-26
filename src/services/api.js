import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

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
