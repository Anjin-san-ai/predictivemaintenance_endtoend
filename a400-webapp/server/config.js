const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 3000,
  dataDir: path.join(__dirname, '..', 'data'),
  flightsFile: path.join(__dirname, '..', 'data', 'flights.json'),
  logsDir: path.join(__dirname, '..', 'data', 'logs'),
  azure: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
  },
  // Neuro-SAN client configuration (optional). If either value is missing the route can still mount but will 500 on use.
  neuro: {
    apiUrl: process.env.NEURO_SAN_API_URL, // e.g. http://localhost:8080/v1/chat/completions
  projectName: process.env.NEURO_SAN_PROJECT_NAME, // logical project/workspace identifier in Neuro-SAN
  summaryProjectName: process.env.NEURO_SAN_SUMMARY_PROJECT_NAME // optional alternate project for squadron summary analytics
  },
  nodeEnv: process.env.NODE_ENV || 'development'
};
