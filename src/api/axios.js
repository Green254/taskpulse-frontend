// src/api/axios.js (example path)

import axios from 'axios';
import { API_URL } from '../config/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
});

export default axiosInstance;
