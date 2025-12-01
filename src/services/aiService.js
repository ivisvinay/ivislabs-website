// This service handles AI chat responses
// You'll need to set up the environment variables in a .env file

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.REACT_APP_API_KEY || 'your-api-key-here';

export const aiService = {
  async getChatResponse(query) {
    try {
      // Remove double slashes from URL
      const url = `${API_BASE_URL}/chat/completions`.replace(/([^:]\/)\/+/g, "$1");
      console.log('Sending request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'granite3.1-dense:latest',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant for IVIS LABS, an AI and Computer Vision company. Answer questions about their services, products, and expertise.'
            },
            { 
              role: 'user', 
              content: query 
            }
          ],
          temperature: 0.9,
          max_tokens: 1000,
          files: [
            { 
              type: 'file', 
              id: process.env.REACT_APP_FILE_ID || 'company-info' 
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting chat response:', error);
      // Return a fallback response
      throw error;
    }
  }
};
