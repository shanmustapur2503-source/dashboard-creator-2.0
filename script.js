// State & Variables
let revenueChart, categoryChart, channelChart;

// Initialize Dashboard on Load
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  setupEventListeners();
});

// Initialize Chart.js Instances
function initCharts() {
  const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  // 1. Line Chart: Revenue Trend
  const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
  revenueChart = new Chart(ctxRevenue, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Revenue (₹)',
          data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 39000, 42000, 48000, 55000],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Orders',
          data: [150, 220, 180, 310, 270, 390, 340, 420, 460, 500, 580, 650],
          borderColor: '#10b981',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      },
      plugins: {
        legend: { labels: { color: textColor } }
      }
    }
  });

  // 2. Doughnut Chart: Category Share
  const ctxCategory = document.getElementById('categoryChart').getContext('2d');
  categoryChart = new Chart(ctxCategory, {
    type: 'doughnut',
    data: {
      labels: ['Wooden Art', 'Wall Frames', 'Fridge Magnets', 'Custom Gifts'],
      datasets: [{
        data: [40, 25, 20, 15],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    }
  });

  // 3. Bar Chart: Sales Channels
  const ctxChannel = document.getElementById('channelChart').getContext('2d');
  channelChart = new Chart(ctxChannel, {
    type: 'bar',
    data: {
      labels: ['Amazon', 'Flipkart', 'Meesho', 'Website', 'Direct'],
      datasets: [{
        label: 'Sales Breakdown',
        data: [420, 380, 510, 230, 120],
        backgroundColor: ['#f97316', '#3b82f6', '#ec4899', '#10b981', '#6366f1'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Event Listeners for Filters, Refresh, Theme Toggle
function setupEventListeners() {
  // Theme Toggle Button
  const themeBtn = document.getElementById('themeToggleBtn');
  themeBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    themeBtn.querySelector('i').className = newTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    
    // Destroy and rebuild charts to apply updated dynamic grid colors
    revenueChart.destroy();
    categoryChart.destroy();
    channelChart.destroy();
    initCharts();
  });

  // Dropdown Filter Change Event
  const filter = document.getElementById('timeRangeFilter');
  filter.addEventListener('change', (e) => {
    updateDashboardData(e.target.value);
  });

  // Refresh Button Event
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', () => {
    refreshBtn.querySelector('i').classList.add('fa-spin');
    setTimeout(() => {
      updateDashboardData(filter.value);
      refreshBtn.querySelector('i').classList.remove('fa-spin');
    }, 600);
  });
}

// Dynamic Data Updating Function
function updateDashboardData(range) {
  let newRevenueData, newOrdersData;

  if (range === '7days') {
    newRevenueData = [5000, 7000, 8000, 6000, 9500, 11000, 12400];
    newOrdersData = [60, 85, 95, 70, 110, 130, 145];
    revenueChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else if (range === '30days') {
    newRevenueData = [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 39000, 42000, 48000, 55000];
    newOrdersData = [150, 220, 180, 310, 270, 390, 340, 420, 460, 500, 580, 650];
    revenueChart.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  } else {
    newRevenueData = [150000, 230000, 310000, 450000];
    newOrdersData = [1800, 2900, 3800, 5200];
    revenueChart.data.labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  }

  // Update line chart
  revenueChart.data.datasets[0].data = newRevenueData;
  revenueChart.data.datasets[1].data = newOrdersData;
  revenueChart.update();

  // Update bar chart with randomized mock updates
  channelChart.data.datasets[0].data = channelChart.data.datasets[0].data.map(
    val => Math.floor(val * (0.9 + Math.random() * 0.2))
  );
  channelChart.update();
}
