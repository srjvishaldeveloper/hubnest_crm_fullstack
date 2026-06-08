const axios = require('axios');

const CHATBOT_URL = process.env.CHATBOT_URL || 'http://localhost:8003';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:8002';
const NODE_BACKEND_SECRET = process.env.NODE_BACKEND_SECRET || 'shared_secret_key';

async function forwardChat(messages, userRole) {
  try {
    const response = await axios.post(
      `${CHATBOT_URL}/api/chat`,
      {
        messages,
        user_role: userRole,
        context: 'crm'
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Backend-Secret': NODE_BACKEND_SECRET
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error forwarding chat to Python AI Chatbot:', error.message);
    throw error;
  }
}

async function forwardReset() {
  try {
    const response = await axios.post(
      `${CHATBOT_URL}/api/chat/reset`,
      {},
      {
        headers: {
          'X-Backend-Secret': NODE_BACKEND_SECRET
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error forwarding reset to Python AI Chatbot:', error.message);
    throw error;
  }
}

async function forwardHealth() {
  try {
    const response = await axios.get(`${CHATBOT_URL}/docs`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Error forwarding health check to Python AI Chatbot:', error.message);
    throw error;
  }
}

async function forwardReport(path, queryParams) {
  try {
    const response = await axios.get(
      `${REPORT_SERVICE_URL}${path}`,
      {
        params: queryParams,
        headers: {
          'X-Backend-Secret': NODE_BACKEND_SECRET
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error forwarding report request to ${path}:`, error.message);
    throw error;
  }
}

async function forwardExport(path, queryParams) {
  try {
    const response = await axios.get(
      `${REPORT_SERVICE_URL}${path}`,
      {
        params: queryParams,
        headers: {
          'X-Backend-Secret': NODE_BACKEND_SECRET
        },
        responseType: 'stream'
      }
    );
    return response;
  } catch (error) {
    console.error(`Error forwarding export request to ${path}:`, error.message);
    throw error;
  }
}

module.exports = {
  forwardChat,
  forwardReset,
  forwardHealth,
  forwardReport,
  forwardExport
};

