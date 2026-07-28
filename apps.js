/**
 * Master Enterprise BI Application Controller
 */
class AnalyticsApp {
    constructor() {
        this.parser = new UniversalDataParser();
        this.rawDataset = [];
        this.filteredDataset = [];
        this.schema = {};
        this.stats = {};
        this.currentPage = 1;
        this.pageSize = 10;

        // Preset Enterprise Datasets
        this.presets = {
            sales: `Date,Region,Category,Sales,Profit,Units
2026-01-01,North,Electronics,12000,2400,15
2026-01-02,South,Furniture,8500,1100,8
2026-01-03,East,Electronics,15400,3100,22
2026-01-04,West,Apparel,4200,850,45
2026-01-05,North,Furniture,9100,1300,10
2026-01-06,South,Electronics,21000,4500,30
2026-01-07,East,Apparel,6300,1200,60`,
            finance: `Date,Department,CostCenter,Expense,Budget,Variance
2026-01-01,Engineering,CC-101,45000,50000,-5000
2026-01-02,Marketing,CC-102,28000,25000,3000
2026-01-03,Sales,CC-103,62000,60000,2000
2026-01-04,HR,CC-104,15000,15000,0
2026-01-05,Engineering,CC-101,52000,50000,2000`,
            hr: `EmployeeID,Department,Role,Salary,PerformanceScore,TenureYears
E-101,Engineering,Senior Dev,125000,92,4
E-102,Marketing,Lead Specialist,88000,85,2
E-103,Sales,Account Executive,95000,88,3
E-104,Engineering,QA Specialist,78000,79,1
E-105,HR,Business Partner,82000,90,5`
        };
    }

    init() {
        this.bindEvents();
        this.loadPresetData('sales');
    }

    bindEvents() {
        // Tab Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
            });
        });

        // Theme Toggle
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            document.getElementById('themeToggleBtn').innerText = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
            this.renderCharts();
        });

        // Preset selector
        document.getElementById('datasetSelect').addEventListener('change', (e) => {
            this.loadPresetData(e.target.value);
        });

        // File upload
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                this.ingestCSVText(evt.target.result, file.name);
            };
            reader.readAsText(file);
        });

        // Filters
        document.getElementById('globalSearchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('categoryFilterSelect').addEventListener('change', () => this.applyFilters());
        document.getElementById('regionFilterSelect').addEventListener('change', () => this.applyFilters());
        document.getElementById('resetFiltersBtn').addEventListener('click', () => {
            document.getElementById('globalSearchInput').value = '';
            document.getElementById('categoryFilterSelect').value = 'ALL';
            document.getElementById('regionFilterSelect').value = 'ALL';
            this.applyFilters();
        });

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });
        document.getElementById('nextPageBtn').addEventListener('click', () => {
            const maxPage = Math.ceil(this.filteredDataset.length / this.pageSize);
            if (this.currentPage < maxPage) {
                this.currentPage++;
                this.renderTable();
            }
        });
    }

    loadPresetData(key) {
        const csvText = this.presets[key];
        this.ingestCSVText(csvText, `Preset: ${key.toUpperCase()}`);
    }

    ingestCSVText(csvText, sourceLabel) {
        const parsed = this.parser.parseCSV(csvText);
        if (!parsed) return;

        this.rawDataset = parsed.data;
        this.filteredDataset = [...this.rawDataset];
        this.schema = parsed.schema;
        this.stats = parsed.stats;

        document.getElementById('dataStatusBadge').innerText = `${sourceLabel} (${this.rawDataset.length} rows)`;
        this.populateFilterDropdowns();
        this.applyFilters();
    }

    populateFilterDropdowns() {
        const catSelect = document.getElementById('categoryFilterSelect');
        const regSelect = document.getElementById('regionFilterSelect');

        catSelect.innerHTML = '<option value="ALL">All Categories</option>';
        regSelect.innerHTML = '<option value="ALL">All Regions</option>';

        const categoricalKeys = Object.keys(this.schema).filter(k => this.schema[k] === 'categorical');
        
        if (categoricalKeys.length > 0) {
            const catKey = categoricalKeys[0];
            const uniqueCats = [...new Set(this.rawDataset.map(r => r[catKey]).filter(Boolean))];
            uniqueCats.forEach(c => {
                catSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });
        }

        if (categoricalKeys.length > 1) {
            const regKey = categoricalKeys[1];
            const uniqueRegs = [...new Set(this.rawDataset.map(r => r[regKey]).filter(Boolean))];
            uniqueRegs.forEach(r => {
                regSelect.innerHTML += `<option value="${r}">${r}</option>`;
            });
        }
    }

    applyFilters() {
        const search = document.getElementById('globalSearchInput').value.toLowerCase();
        const selectedCat = document.getElementById('categoryFilterSelect').value;
        const selectedReg = document.getElementById('regionFilterSelect').value;

        const categoricalKeys = Object.keys(this.schema).filter(k => this.schema[k] === 'categorical');

        this.filteredDataset = this.rawDataset.filter(row => {
            // Global text match
            const matchesSearch = !search || Object.values(row).some(v => String(v).toLowerCase().includes(search));

            // Categorical Select Filter
            let matchesCat = true;
            if (selectedCat !== 'ALL' && categoricalKeys[0]) {
                matchesCat = String(row[categoricalKeys[0]]) === selectedCat;
            }

            let matchesReg = true;
            if (selectedReg !== 'ALL' && categoricalKeys[1]) {
                matchesReg = String(row[categoricalKeys[1]]) === selectedReg;
            }

            return matchesSearch && matchesCat && matchesReg;
        });

        this.currentPage = 1;
        this.refreshUI();
    }

    refreshUI() {
        const kpis = AnalyticsEngine.computeKPIs(this.filteredDataset, this.schema, this.stats);
        this.renderKPIs(kpis);
        this.renderCharts();
        this.renderInsights(kpis);
        this.renderTable();
    }

    renderKPIs(kpis) {
        const container = document.getElementById('kpiContainer');
        container.innerHTML = `
            <div class="kpi-card">
                <span class="kpi-title">Total Filtered Records</span>
                <span class="kpi-value">${kpis.totalRecords.toLocaleString()}</span>
                <span class="kpi-subtext positive">Total Ingested Rows</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-title">Total ${kpis.primaryMetricName}</span>
                <span class="kpi-value">$${kpis.totalValue.toLocaleString()}</span>
                <span class="kpi-subtext positive">Sum Aggregation</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-title">Average Level</span>
                <span class="kpi-value">${kpis.avgValue.toFixed(2)}</span>
                <span class="kpi-subtext">Per Record Metric</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-title">Top Category Leader</span>
                <span class="kpi-value">${kpis.topCategory}</span>
                <span class="kpi-subtext positive">Leading Slice</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-title">Data Completeness Index</span>
                <span class="kpi-value">${kpis.qualityScore}%</span>
                <span class="kpi-subtext ${kpis.qualityScore >= 90 ? 'positive' : 'negative'}">Hygiene Matrix Score</span>
            </div>
        `;
    }

    renderCharts() {
        const numericKeys = Object.keys(this.schema).filter(k => this.schema[k] === 'numeric');
        const categoricalKeys = Object.keys(this.schema).filter(k => this.schema[k] === 'categorical');

        const primaryNum = numericKeys[0] || null;
        const primaryCat = categoricalKeys[0] || null;

        // Line Chart Data
        const linePoints = this.filteredDataset.map(r => Number(r[primaryNum]) || 0);
        CustomChartEngine.drawLineChart('lineChartCanvas', [], linePoints, primaryNum);

        // Donut Data
        if (primaryCat && primaryNum) {
            const agg = {};
            this.filteredDataset.forEach(r => {
                const cat = r[primaryCat] || 'Other';
                agg[cat] = (agg[cat] || 0) + (Number(r[primaryNum]) || 0);
            });
            CustomChartEngine.drawDonutChart('donutChartCanvas', Object.keys(agg), Object.values(agg));
            CustomChartEngine.drawBarChart('barChartCanvas', Object.keys(agg), Object.values(agg));
        }

        // Scatter & Radar
        const scatterPts = this.filteredDataset.slice(0, 50).map((r, i) => ({
            x: (i * 10) % 100,
            y: Math.min(100, ((Number(r[primaryNum]) || 0) / 500))
        }));
        CustomChartEngine.drawScatterPlot('scatterChartCanvas', scatterPts);

        const radarData = [80, 65, 90, 75, 88];
        CustomChartEngine.drawRadarChart('radarChartCanvas', ['Quality', 'Growth', 'Volume', 'Fidelity', 'Margin'], radarData);
    }

    renderInsights(kpis) {
        const listContainer = document.getElementById('insightsList');
        const insights = AnalyticsEngine.generateExecutiveInsights(this.filteredDataset, this.schema, kpis);

        listContainer.innerHTML = insights.map(item => `
            <div class="insight-card ${item.type}">
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
            </div>
        `).join('');
    }

    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        const keys = Object.keys(this.schema);
        thead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;

        const startIdx = (this.currentPage - 1) * this.pageSize;
        const pageRows = this.filteredDataset.slice(startIdx, startIdx + this.pageSize);

        tbody.innerHTML = pageRows.map(row => `
            <tr>${keys.map(k => `<td>${row[k] !== null ? row[k] : ''}</td>`).join('')}</tr>
        `).join('');

        const total = this.filteredDataset.length;
        document.getElementById('tableInfoText').innerText = `Showing ${startIdx + 1} to ${Math.min(startIdx + this.pageSize, total)} of ${total} entries`;
        document.getElementById('currentPageSpan').innerText = `Page ${this.currentPage}`;
    }

    exportFilteredData() {
        if (this.filteredDataset.length === 0) return;
        const keys = Object.keys(this.schema);
        let csvContent = keys.join(',') + '\n';

        this.filteredDataset.forEach(row => {
            const line = keys.map(k => `"${row[k] !== null ? row[k] : ''}"`).join(',');
            csvContent += line + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_analytics_data.csv';
        a.click();
    }

    applyWhiteLabelSettings() {
        const name = document.getElementById('companyNameInput').value;
        const logo = document.getElementById('logoTextInput').value;
        const color = document.getElementById('accentColorInput').value;

        if (name) document.getElementById('brandTitle').innerText = name;
        if (logo) document.getElementById('brandLogoIcon').innerText = logo;
        if (color) {
            document.documentElement.style.setProperty('--accent-color', color);
            this.renderCharts();
        }
        alert('Branding and White Label customization applied successfully!');
    }
}

// Bootstrap Platform
const app = new AnalyticsApp();
window.addEventListener('DOMContentLoaded', () => app.init());
