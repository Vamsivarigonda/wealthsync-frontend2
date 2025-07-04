import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [email, setEmail] = useState('');
  const [income, setIncome] = useState('');
  const [location, setLocation] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [physiologicalExpenses, setPhysiologicalExpenses] = useState('');
  const [safetyExpenses, setSafetyExpenses] = useState('');
  const [socialExpenses, setSocialExpenses] = useState('');
  const [esteemExpenses, setEsteemExpenses] = useState('');
  const [selfActualizationExpenses, setSelfActualizationExpenses] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);

  // Fetch cities from backend on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await requestWithRetry(
          () => axios.get('https://wealthsync-backend2.onrender.com/api/cities', { timeout: 30000 }),
          5, // 5 retries
          10000 // 10 seconds delay between retries
        );
        setCities(response.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Error fetching cities. Please try refreshing the page or check your internet connection.');
      }
    };
    fetchCities();
  }, []);

  const totalExpenses = (
    parseFloat(physiologicalExpenses || 0) +
    parseFloat(safetyExpenses || 0) +
    parseFloat(socialExpenses || 0) +
    parseFloat(esteemExpenses || 0) +
    parseFloat(selfActualizationExpenses || 0)
  ).toFixed(2);

  const requestWithRetry = async (requestFn, retries = 3, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await requestWithRetry(() =>
        axios.post('https://wealthsync-backend2.onrender.com/api/budget', {
          email,
          income,
          expenses: totalExpenses,
          savings_goal: savingsGoal,
          location,
          expense_categories: {
            physiological: parseFloat(physiologicalExpenses || 0),
            safety: parseFloat(safetyExpenses || 0),
            social: parseFloat(socialExpenses || 0),
            esteem: parseFloat(esteemExpenses || 0),
            self_actualization: parseFloat(selfActualizationExpenses || 0),
          }
        }, { timeout: 30000 })
      );
      setResult(response.data);
      fetchHistory();
    } catch (error) {
      alert('Error calculating budget. The backend might be waking up—please try again in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await requestWithRetry(() =>
        axios.post('https://wealthsync-backend2.onrender.com/api/budget/history', {
          email
        }, { timeout: 30000 })
      );
      setHistory(response.data);
    } catch (error) {
      alert('Error fetching budget history. The backend might be waking up—please try again in a few seconds.');
    }
  };

  const chartData = result ? {
    labels: ['Physiological', 'Safety', 'Social', 'Esteem', 'Self-Actualization', 'Savings', 'Recommended Savings'],
    datasets: [
      {
        label: 'Budget Breakdown',
        data: [
          result.expense_categories.physiological || 0,
          result.expense_categories.safety || 0,
          result.expense_categories.social || 0,
          result.expense_categories.esteem || 0,
          result.expense_categories.self_actualization || 0,
          result.savings || 0,
          result.recommended_savings || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="App">
      <h2>WealthSync Budget Planner</h2>
      <div className="form-container">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">Select Your City</option>
          {cities.map((city) => (
            <option key={city.name.toLowerCase()} value={city.name.toLowerCase()}>
              {city.name} ({city.state})
            </option>
          ))}
        </select>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="Monthly Income (₹)"
        />
        <h3>Break Down Your Expenses</h3>
        <div className="input-with-tooltip">
          <input
            type="number"
            value={physiologicalExpenses}
            onChange={(e) => setPhysiologicalExpenses(e.target.value)}
            placeholder="Physiological Expenses (₹)"
          />
          <span className="tooltip">e.g., food, rent, utilities</span>
        </div>
        <div className="input-with-tooltip">
          <input
            type="number"
            value={safetyExpenses}
            onChange={(e) => setSafetyExpenses(e.target.value)}
            placeholder="Safety Expenses (₹)"
          />
          <span className="tooltip">e.g., insurance, emergency savings</span>
        </div>
        <div className="input-with-tooltip">
          <input
            type="number"
            value={socialExpenses}
            onChange={(e) => setSocialExpenses(e.target.value)}
            placeholder="Social Expenses (₹)"
          />
          <span className="tooltip">e.g., outings, gifts</span>
        </div>
        <div className="input-with-tooltip">
          <input
            type="number"
            value={esteemExpenses}
            onChange={(e) => setEsteemExpenses(e.target.value)}
            placeholder="Esteem Expenses (₹)"
          />
          <span className="tooltip">e.g., education, personal achievements</span>
        </div>
        <div className="input-with-tooltip">
          <input
            type="number"
            value={selfActualizationExpenses}
            onChange={(e) => setSelfActualizationExpenses(e.target.value)}
            placeholder="Self-Actualization Expenses (₹)"
          />
          <span className="tooltip">e.g., hobbies, personal growth</span>
        </div>
        <p>Total Expenses: ₹{totalExpenses}</p>
        <input
          type="number"
          value={savingsGoal}
          onChange={(e) => setSavingsGoal(e.target.value)}
          placeholder="Savings Goal (₹)"
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : 'Plan My Budget'}
        </button>
      </div>
      {result && (
        <div className="result-container">
          <p>Your Savings: ₹{result.savings}</p>
          <p>Adjusted Savings (after cost of living): ₹{result.adjusted_savings}</p>
          <p>Recommended Savings: ₹{result.recommended_savings}</p>
          <div className="info-with-tooltip">
            <p>Inflation Rate in Your Area: {result.inflation}%</p>
            <span className="tooltip">This is the annual inflation rate for your location, affecting your savings goal.</span>
          </div>
          <div className="info-with-tooltip">
            <p>Cost of Living Index: {result.cost_of_living_index}</p>
            <span className="tooltip">A higher index means a more expensive location (baseline = 50).</span>
          </div>
          <p>{result.message}</p>
          <div className="recommendations">
            <h3>Personalized Tips</h3>
            <ul>
              {result.recommendations.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          {chartData && (
            <div className="chart-container">
              <h3>Budget Breakdown</h3>
              <Pie data={chartData} />
            </div>
          )}
        </div>
      )}
      <div className="history-container">
        <h3>Your Budget History</h3>
        {email ? (
          <button onClick={fetchHistory} disabled={loading}>
            {loading ? 'Loading...' : 'View Budget History'}
          </button>
        ) : (
          <p>Please enter your email to view history.</p>
        )}
        {history.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Income (₹)</th>
                <th>Expenses (₹)</th>
                <th>Savings (₹)</th>
                <th>Recommended Savings (₹)</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td>{entry.income}</td>
                  <td>{entry.expenses}</td>
                  <td>{entry.savings}</td>
                  <td>{entry.recommended_savings}</td>
                  <td>{entry.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          email && <p>No budget history found for this email.</p>
        )}
      </div>
    </div>
  );
}

export default App;
