import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5001'; // Update with your server port
const MATCH_ID = '91874'; // Update with a real match ID

// Test functions
async function testInitializeTeamStocks() {
  try {
    console.log(`Initializing team stocks for match ${MATCH_ID}...`);
    const response = await axios.post(`${API_BASE_URL}/cricket/initialize-team-stocks/${MATCH_ID}`);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error initializing team stocks:', error.response?.data || error.message);
  }
}

async function testUpdateTeamStocks(teamId, eventType, runs = 0) {
  try {
    console.log(`Updating team ${teamId} stocks for match ${MATCH_ID} with event ${eventType}...`);
    const response = await axios.post(`${API_BASE_URL}/cricket/update-team-stocks/${MATCH_ID}`, {
      teamId,
      eventType,
      runs
    });
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating team stocks:', error.response?.data || error.message);
  }
}

async function testUpdateTeamStocksCalculated(teamId, calculatedPrice) {
  try {
    console.log(`Updating team ${teamId} stocks for match ${MATCH_ID} with calculated price ${calculatedPrice}...`);
    const response = await axios.post(`${API_BASE_URL}/cricket/update-team-stocks-calculated/${MATCH_ID}`, {
      teamId,
      calculatedPrice
    });
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating team stocks with calculated price:', error.response?.data || error.message);
  }
}

async function testAutoSellTeamPortfolios(status) {
  try {
    console.log(`Testing auto-sell team portfolios for match ${MATCH_ID} with status "${status}"...`);
    const response = await axios.post(`${API_BASE_URL}/cricket/auto-sell-team-portfolios/${MATCH_ID}`, {
      status
    });
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error auto-selling team portfolios:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  // First initialize team stocks
  await testInitializeTeamStocks();
  
  // Wait a bit between calls
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Update team A with runs scored
  const teamAId = '129066'; // Update with real team ID
  await testUpdateTeamStocks(teamAId, 'runs_scored', 10);
  
  // Wait a bit between calls
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Update team B with player out
  const teamBId = '129065'; // Update with real team ID
  await testUpdateTeamStocks(teamBId, 'player_out');
  
  // Wait a bit between calls
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Update team A with calculated price
  await testUpdateTeamStocksCalculated(teamAId, 75);
  
  // Wait a bit between calls
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test auto-sell with match over status
  await testAutoSellTeamPortfolios('match over');
}

// Run all tests
runTests().catch(console.error); 