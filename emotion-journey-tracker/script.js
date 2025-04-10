// Initialize variables to store journey data
let journeyData = {
    metrics: ['confidence', 'happiness', 'motivation'], // Default metrics
    points: [],
    categories: ['Work', 'Personal', 'Learning', 'Other'] // Default categories
};

// UI state
let selectedMetrics = []; // Now tracking multiple metrics at once
let sortByValue = false;
let filterCategory = 'all';
let chartType = 'line';
let darkMode = false;

// Chart objects
let emotionChart = null;
let radarChart = null;
let statsChart = null;

// Initialize charts
function initializeCharts() {
    // Main emotion chart
    const ctx = document.getElementById('emotion-chart').getContext('2d');
    
    emotionChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Level'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Timeline'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const metric = context.dataset.label;
                            const value = context.formattedValue;
                            return `${metric}: ${value}`;
                        },
                        afterLabel: function(context) {
                            // Find the annotation for this point
                            const metric = context.dataset.label;
                            const milestone = context.label;
                            const points = journeyData.points.filter(p => 
                                p.metric === metric.toLowerCase() && 
                                p.milestone === milestone && 
                                p.annotation
                            );
                            
                            if (points.length > 0 && points[0].annotation) {
                                return points[0].annotation;
                            }
                            return '';
                        }
                    }
                },
                annotation: {
                    annotations: {}
                }
            }
        }
    });
    
    // Initialize radar chart for comparing metrics
    const radarCtx = document.getElementById('radar-chart').getContext('2d');
    radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: [],
            datasets: [{
                label: 'Current Values',
                data: [],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(99, 102, 241)'
            }]
        },
        options: {
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            }
        }
    });
    
    // Stats chart
    const statsCtx = document.getElementById('stats-chart').getContext('2d');
    statsChart = new Chart(statsCtx, {
        type: 'bar',
        data: {
            labels: ['Average', 'Highest', 'Lowest'],
            datasets: [{
                label: 'Statistics',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(239, 68, 68, 0.6)'
                ],
                borderColor: [
                    'rgb(99, 102, 241)',
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
}

// Initialize the application
function init() {
    // Default to showing all metrics
    selectedMetrics = [...journeyData.metrics];
    
    initializeCharts();
    populateMetricChips();
    populateCategorySelect();
    
    // Event listeners for form inputs
    document.getElementById('value-input').addEventListener('input', (e) => {
        document.getElementById('value-display').textContent = e.target.value;
    });
    
    // Event listeners for buttons
    document.getElementById('add-point-btn').addEventListener('click', addDataPoint);
    document.getElementById('quick-add-btn').addEventListener('click', quickAddPoint);
    document.getElementById('save-btn').addEventListener('click', saveJourney);
    document.getElementById('load-btn').addEventListener('click', loadJourney);
    document.getElementById('export-btn').addEventListener('click', exportJourney);
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importJourney);
    document.getElementById('add-metric-btn').addEventListener('click', addNewMetric);
    document.getElementById('sort-btn').addEventListener('click', toggleSort);
    document.getElementById('filter-category').addEventListener('change', (e) => {
        filterCategory = e.target.value;
        updatePointsList();
        updateChartDisplay();
    });
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
    
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
        });
    });
    
    // Load data if exists
    const savedData = localStorage.getItem('emotionJourney');
    if (savedData) {
        journeyData = JSON.parse(savedData);
        selectedMetrics = [...journeyData.metrics]; // Default to showing all metrics
        
        populateMetricChips();
        populateCategorySelect();
        updateChartDisplay();
        updatePointsList();
        updateStatistics();
    }
}

// Generate metric selection chips
function populateMetricChips() {
    const container = document.getElementById('metrics-container');
    container.innerHTML = '';
    
    // Create a chip for each metric
    journeyData.metrics.forEach(metric => {
        const chip = document.createElement('div');
        chip.className = 'metric-chip';
        chip.textContent = capitalizeFirstLetter(metric);
        chip.dataset.metric = metric;
        
        if (selectedMetrics.includes(metric)) {
            chip.classList.add('active');
        }
        
        chip.addEventListener('click', () => toggleMetric(metric, chip));
        container.appendChild(chip);
    });
    
    // Also populate the metric dropdown for quick add
    const metricSelect = document.getElementById('metric-select');
    metricSelect.innerHTML = '';
    
    journeyData.metrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = capitalizeFirstLetter(metric);
        metricSelect.appendChild(option);
    });
}

// Toggle the selection of a metric
function toggleMetric(metric, chipElement) {
    const index = selectedMetrics.indexOf(metric);
    
    if (index === -1) {
        // Add the metric if not already selected
        selectedMetrics.push(metric);
        chipElement.classList.add('active');
    } else if (selectedMetrics.length > 1) {
        // Remove the metric if already selected (but keep at least one)
        selectedMetrics.splice(index, 1);
        chipElement.classList.remove('active');
    }
    
    updateChartDisplay();
    updateStatistics();
}

// Quick add a data point with minimal info
function quickAddPoint() {
    const metric = document.getElementById('metric-select').value;
    const value = parseInt(document.getElementById('quick-value').value);
    
    // Generate a timestamp for the milestone
    const now = new Date();
    const milestone = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Add the point
    journeyData.points.push({
        milestone,
        value,
        annotation: '',
        category: 'Other',
        metric,
        timestamp: now.getTime()
    });
    
    // Ensure the metric is selected
    if (!selectedMetrics.includes(metric)) {
        selectedMetrics.push(metric);
        populateMetricChips();
    }
    
    updateChartDisplay();
    updatePointsList();
    updateStatistics();
    
    // Show confirmation
    showNotification('Point added!');
    
    // Reset the quick add input
    document.getElementById('quick-value').value = 5;
}

// Add a new data point with full details
function addDataPoint() {
    const milestone = document.getElementById('milestone-input').value.trim();
    const value = parseInt(document.getElementById('value-input').value);
    const annotation = document.getElementById('annotation-input').value.trim();
    const category = document.getElementById('category-select').value;
    const metric = document.getElementById('metric-select').value;
    
    if (!milestone) {
        alert('Please enter a milestone or week name');
        return;
    }
    
    // Create a timestamp for sorting by date added
    const timestamp = new Date().getTime();
    
    // Add the point to our data array
    journeyData.points.push({
        milestone,
        value,
        annotation,
        category,
        metric,
        timestamp
    });
    
    // Ensure the metric is selected
    if (!selectedMetrics.includes(metric)) {
        selectedMetrics.push(metric);
        populateMetricChips();
    }
    
    // Update the display
    updateChartDisplay();
    updatePointsList();
    updateStatistics();
    
    // Clear inputs
    document.getElementById('milestone-input').value = '';
    document.getElementById('value-input').value = 5;
    document.getElementById('value-display').textContent = '5';
    document.getElementById('annotation-input').value = '';
    
    // Save automatically
    saveJourneyQuiet();
}

// Populate the category select dropdown
function populateCategorySelect() {
    const categorySelect = document.getElementById('category-select');
    categorySelect.innerHTML = '';
    
    journeyData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Also update the filter dropdown
    const filterSelect = document.getElementById('filter-category');
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
    
    journeyData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterSelect.appendChild(option);
    });
}

// Add a new metric to track
function addNewMetric() {
    const newMetricInput = document.getElementById('new-metric-input');
    const newMetric = newMetricInput.value.trim().toLowerCase();
    
    if (newMetric && !journeyData.metrics.includes(newMetric)) {
        journeyData.metrics.push(newMetric);
        selectedMetrics.push(newMetric); // Auto-select new metrics
        populateMetricChips();
        newMetricInput.value = '';
        updateChartDisplay();
        saveJourneyQuiet();
    } else if (journeyData.metrics.includes(newMetric)) {
        alert('This metric already exists');
    } else {
        alert('Please enter a valid metric name');
    }
}

// Toggle sort order between milestone and value
function toggleSort() {
    sortByValue = !sortByValue;
    
    const sortBtn = document.getElementById('sort-btn');
    sortBtn.textContent = sortByValue ? 'Sort by Milestone' : 'Sort by Value';
    
    updatePointsList();
}

// Update chart with current data
function updateChartDisplay() {
    if (selectedMetrics.length === 0) return;
    
    // Get all points for selected metrics
    const allSelectedPoints = journeyData.points.filter(point => 
        selectedMetrics.includes(point.metric)
    );
    
    // Apply category filter if needed
    let filteredPoints = allSelectedPoints;
    if (filterCategory !== 'all') {
        filteredPoints = allSelectedPoints.filter(point => point.category === filterCategory);
    }
    
    // Get all unique milestones across selected metrics
    const allMilestones = [...new Set(filteredPoints.map(p => p.milestone))];
    
    // Sort milestones chronologically or by value depending on sort setting
    if (sortByValue) {
        // For value sorting, we need to use the actual points
        // We'll use the first selected metric as the sort key
        const primaryMetric = selectedMetrics[0];
        const primaryPoints = filteredPoints.filter(p => p.metric === primaryMetric);
        primaryPoints.sort((a, b) => a.value - b.value);
        allMilestones.sort((a, b) => {
            const pointA = primaryPoints.find(p => p.milestone === a);
            const pointB = primaryPoints.find(p => p.milestone === b);
            if (!pointA || !pointB) return 0;
            return pointA.value - pointB.value;
        });
    } else {
        // Sort milestones alphabetically
        allMilestones.sort();
    }
    
    // Create a dataset for each selected metric
    const datasets = selectedMetrics.map((metric, index) => {
        // Define a set of colors for various metrics
        const colors = [
            { border: 'rgb(99, 102, 241)', bg: 'rgba(99, 102, 241, 0.2)' },   // Indigo
            { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.2)' },     // Red
            { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.2)' },   // Green
            { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.2)' },   // Amber
            { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.2)' },   // Purple
            { border: 'rgb(14, 165, 233)', bg: 'rgba(14, 165, 233, 0.2)' }    // Sky
        ];
        
        // Get points for this metric
        const metricPoints = filteredPoints.filter(p => p.metric === metric);
        
        // For each milestone, find the corresponding value for this metric
        const values = allMilestones.map(milestone => {
            const point = metricPoints.find(p => p.milestone === milestone);
            return point ? point.value : null; // Use null for missing values
        });
        
        return {
            label: capitalizeFirstLetter(metric),
            data: values,
            borderColor: colors[index % colors.length].border,
            backgroundColor: colors[index % colors.length].bg,
            tension: 0.4,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7
        };
    });
    
    // Update chart data
    emotionChart.data.labels = allMilestones;
    emotionChart.data.datasets = datasets;
    
    // Add annotations for points with notes
    const annotations = {};
    filteredPoints.forEach((point, index) => {
        if (point.annotation) {
            const datasetIndex = selectedMetrics.indexOf(point.metric);
            const pointIndex = allMilestones.indexOf(point.milestone);
            
            if (datasetIndex !== -1 && pointIndex !== -1) {
                annotations[`note-${index}`] = {
                    type: 'point',
                    xValue: pointIndex,
                    yValue: point.value,
                    datasetIndex: datasetIndex,
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    borderColor: 'white',
                    radius: 4
                };
            }
        }
    });
    
    emotionChart.options.plugins.annotation.annotations = annotations;
    
    // Update chart
    emotionChart.update();
    
    // Update radar chart too
    updateRadarChart();
}

// Update the radar chart with the latest values for each metric
function updateRadarChart() {
    // Get the latest value for each selected metric
    const latestValues = {};
    const latestTimestamps = {};
    
    // Find the most recent point for each metric
    journeyData.points.forEach(point => {
        if (selectedMetrics.includes(point.metric)) {
            if (!latestTimestamps[point.metric] || point.timestamp > latestTimestamps[point.metric]) {
                latestValues[point.metric] = point.value;
                latestTimestamps[point.metric] = point.timestamp;
            }
        }
    });
    
    // Update the radar chart
    radarChart.data.labels = selectedMetrics.map(capitalizeFirstLetter);
    radarChart.data.datasets[0].data = selectedMetrics.map(metric => latestValues[metric] || 0);
    radarChart.update();
}

// Update statistics for selected metrics
function updateStatistics() {
    if (selectedMetrics.length === 0) return;
    
    // For simplicity, calculate stats for the first selected metric
    const primaryMetric = selectedMetrics[0];
    const metricPoints = journeyData.points.filter(point => point.metric === primaryMetric);
    
    if (metricPoints.length === 0) {
        statsChart.data.datasets[0].data = [0, 0, 0];
        statsChart.update();
        document.getElementById('avg-value').textContent = '-';
        document.getElementById('high-value').textContent = '-';
        document.getElementById('low-value').textContent = '-';
        document.getElementById('trend-value').textContent = '-';
        return;
    }
    
    // Calculate statistics
    const values = metricPoints.map(point => point.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Update stats chart
    statsChart.data.datasets[0].data = [avg, max, min];
    statsChart.update();
    
    // Update stats text
    document.getElementById('avg-value').textContent = avg.toFixed(1);
    document.getElementById('high-value').textContent = max;
    document.getElementById('low-value').textContent = min;
    
    // Calculate trend
    if (metricPoints.length >= 3) {
        const recentPoints = [...metricPoints].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
        const recentAvg = recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;
        
        let trend;
        if (recentAvg > avg + 0.5) {
            trend = 'Rising';
        } else if (recentAvg < avg - 0.5) {
            trend = 'Falling';
        } else {
            trend = 'Stable';
        }
        
        const trendElement = document.getElementById('trend-value');
        trendElement.textContent = trend;
        trendElement.className = trend.toLowerCase();
    } else {
        document.getElementById('trend-value').textContent = 'N/A';
    }
}

// Display all data points in the list
function updatePointsList() {
    const pointsList = document.getElementById('points-list');
    pointsList.innerHTML = '';
    
    // Get all points (we'll display all metrics but can filter by category)
    let displayPoints = [...journeyData.points];
    
    if (filterCategory !== 'all') {
        displayPoints = displayPoints.filter(point => point.category === filterCategory);
    }
    
    // Sort points
    if (sortByValue) {
        // Sort by value (low to high)
        displayPoints.sort((a, b) => a.value - b.value);
    } else {
        // Group by metric first, then sort by milestone within each group
        displayPoints.sort((a, b) => {
            if (a.metric !== b.metric) {
                return a.metric.localeCompare(b.metric);
            }
            return a.milestone.localeCompare(b.milestone);
        });
    }
    
    // Group points by metric
    const groupedPoints = {};
    displayPoints.forEach(point => {
        if (!groupedPoints[point.metric]) {
            groupedPoints[point.metric] = [];
        }
        groupedPoints[point.metric].push(point);
    });
    
    // Add points organized by metric
    Object.keys(groupedPoints).sort().forEach(metric => {
        if (selectedMetrics.includes(metric)) {
            const metricHeader = document.createElement('h3');
            metricHeader.className = 'mb-2';
            metricHeader.textContent = capitalizeFirstLetter(metric);
            pointsList.appendChild(metricHeader);
            
            groupedPoints[metric].forEach(point => {
                const li = document.createElement('li');
                li.className = 'point-item mb-2';
                
                // Find the original index for editing/deleting
                const originalIndex = journeyData.points.findIndex(p => 
                    p.milestone === point.milestone && 
                    p.value === point.value && 
                    p.metric === point.metric &&
                    p.timestamp === point.timestamp
                );
                
                li.innerHTML = `
                    <div class="point-content">
                        <span class="point-category">${point.category}</span>
                        <span class="point-milestone">${point.milestone}</span>: 
                        <span class="point-value">${point.value}/10</span>
                        ${point.annotation ? `<div class="point-annotation">${point.annotation}</div>` : ''}
                    </div>
                    <div class="point-actions">
                        <button class="btn-sm edit-btn" data-index="${originalIndex}">Edit</button>
                        <button class="btn-sm btn-danger delete-btn" data-index="${originalIndex}">Delete</button>
                    </div>
                `;
                
                pointsList.appendChild(li);
            });
        }
    });
    
    // If no points to display, show a message
    if (pointsList.children.length === 0) {
        const noData = document.createElement('p');
        noData.className = 'text-center';
        noData.textContent = 'No data points to display.';
        pointsList.appendChild(noData);
    }
    
    // Add event listeners to buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deletePoint(index);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            editPoint(index);
        });
    });
}

// Delete a data point
function deletePoint(index) {
    if (confirm('Delete this data point?')) {
        journeyData.points.splice(index, 1);
        updateChartDisplay();
        updatePointsList();
        updateStatistics();
        saveJourneyQuiet();
    }
}

// Edit a data point
function editPoint(index) {
    const point = journeyData.points[index];
    
    // Populate the form with existing data
    document.getElementById('metric-select').value = point.metric;
    document.getElementById('milestone-input').value = point.milestone;
    document.getElementById('value-input').value = point.value;
    document.getElementById('value-display').textContent = point.value;
    document.getElementById('annotation-input').value = point.annotation || '';
    document.getElementById('category-select').value = point.category || 'Other';
    
    // Remove the old point
    journeyData.points.splice(index, 1);
    
    // Update display
    updateChartDisplay();
    updatePointsList();
    updateStatistics();
    
    // Scroll to data entry
    document.querySelector('.data-entry-panel').scrollIntoView({ behavior: 'smooth' });
}

// Toggle dark/light mode
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.getElementById('dark-mode-toggle').textContent = darkMode ? 'Light Mode' : 'Dark Mode';
}

// Save journey data to localStorage with notification
function saveJourney() {
    localStorage.setItem('emotionJourney', JSON.stringify(journeyData));
    showNotification('save-confirmation');
}

// Save journey data quietly (no notification)
function saveJourneyQuiet() {
    localStorage.setItem('emotionJourney', JSON.stringify(journeyData));
}

// Load journey data from localStorage
function loadJourney() {
    const savedData = localStorage.getItem('emotionJourney');
    
    if (savedData) {
        journeyData = JSON.parse(savedData);
        selectedMetrics = [...journeyData.metrics]; // Show all metrics
        
        populateMetricChips();
        populateCategorySelect();
        updateChartDisplay();
        updatePointsList();
        updateStatistics();
        
        showNotification('load-confirmation');
    } else {
        alert('No saved journey found.');
    }
}

// Export journey data to a file
function exportJourney() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(journeyData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "emotion_journey.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification('export-confirmation');
}

// Import journey data from a file
function importJourney(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate the imported data
                if (importedData.metrics && Array.isArray(importedData.points)) {
                    journeyData = importedData;
                    
                    // Ensure we have categories
                    if (!journeyData.categories) {
                        journeyData.categories = ['Work', 'Personal', 'Learning', 'Other'];
                    }
                    
                    selectedMetrics = [...journeyData.metrics]; // Show all metrics
                    
                    populateMetricChips();
                    populateCategorySelect();
                    updateChartDisplay();
                    updatePointsList();
                    updateStatistics();
                    
                    showNotification('import-confirmation');
                } else {
                    alert('Invalid journey data format.');
                }
            } catch (error) {
                alert('Error parsing the imported file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Reset file input
    event.target.value = null;
}

// Show a notification
function showNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

// Helper function to capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);