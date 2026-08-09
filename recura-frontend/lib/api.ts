import axios from "axios";

const fastAPIClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

const nodeAPIClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

fastAPIClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("recura_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

fastAPIClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("recura_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const predictionAPI = {
  single: (data: any) =>
    fastAPIClient.post("/predict", data),

  batch: (formData: FormData) =>
    fastAPIClient.post("/predict/batch", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getHistory: (page = 1, limit = 10) =>
    fastAPIClient.get(`/predictions?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    fastAPIClient.get(`/predictions/${id}`),
};

export const llmAPI = {
  parseNotes: (notes: string) =>
    fastAPIClient.post("/parse-notes", { text: notes }),
};

export const authAPI = {
  login: (email: string, password: string) =>
    nodeAPIClient.post("/auth/login", { email, password }),

  signup: (data: any) =>
    nodeAPIClient.post("/auth/signup", data),

  logout: () =>
    nodeAPIClient.post("/auth/logout"),
};

export { fastAPIClient, nodeAPIClient };
