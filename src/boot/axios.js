import { boot } from "quasar/wrappers";
import axios from "axios";

// Default API instance
const api = axios.create({
  baseURL: "https://api.example.com", // Default base URL
});

// Specific instance for LLM API
const llmApi = axios.create({
  baseURL: "https://litellm.staging.klue.io/v1/", // LLM base URL
});

// Boot file setup
export default boot(({ app }) => {
  // Add Axios globally for use in Vue Options API
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  // Optional: Add the LLM API globally if needed
  app.config.globalProperties.$llmApi = llmApi;
});

export { api, llmApi };
