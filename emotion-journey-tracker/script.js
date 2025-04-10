// Initialize variables to store journey data
let journeyData = {
    metric: 'confidence',
    points: []
};

// Chart object
let emotionChart = null;

// DOM elements
const metricSelect = document.getElementById('metric-select');
const milestoneInput = document.getElementById('milestone-input');
const valueInput = document.getElementById('value-input');
const valueDisplay = document.getElementById('value-display');
const annotationInput = document.getElementById('annotation-input');
const addPointBtn = document.getElementById('add-point-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const pointsList = document.getElementById('points-list');

// Initialize chart
function initializeChart() {
    const ctx = document.getElementById('emotion-chart').getContext('2d');
    
    emotionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: capitalizeFirstLetter(journeyData.metric),
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12,
                    title: {
                        display: true,
                        text: capitalizeFirstLetter(journeyData.metric) + ' Level'
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
                        // Override the title and label to be empty
                        title: function() { return ''; },
                        label: function(context) {
                            const pointIndex = context.dataIndex;
                            const annotation = journeyData.points[pointIndex].annotation;
                            // Only show the annotation
                            return annotation ? annotation : 'No annotation';
                        }
                    }
                },
                annotation: {
                    annotations: {}
                }
            }
        }
    });
}

// Initialize the application
function init() {
    initializeChart();
    updateChartDisplay();
    
    // Event listeners
    valueInput.addEventListener('input', () => {
        valueDisplay.textContent = valueInput.value;
    });
    
    metricSelect.addEventListener('change', () => {
        journeyData.metric = metricSelect.value;
        updateChartDisplay();
    });
    
    addPointBtn.addEventListener('click', addDataPoint);
    saveBtn.addEventListener('click', saveJourney);
    loadBtn.addEventListener('click', loadJourney);
}

// Add a new data point
function addDataPoint() {
    const milestone = milestoneInput.value.trim();
    const value = parseInt(valueInput.value);
    const annotation = annotationInput.value.trim();
    
    if (!milestone) {
        alert('Please enter a milestone or week name');
        return;
    }
    
    // Add the point to our data array
    journeyData.points.push({
        milestone,
        value,
        annotation
    });
    
    // Sort points by milestone (assuming milestones might be out of order)
    journeyData.points.sort((a, b) => {
        if (a.milestone < b.milestone) return -1;
        if (a.milestone > b.milestone) return 1;
        return 0;
    });
    
    // Update the display
    updateChartDisplay();
    updatePointsList();
    
    // Clear inputs
    milestoneInput.value = '';
    valueInput.value = 5;
    valueDisplay.textContent = '5';
    annotationInput.value = '';
}

// Update the chart with current data
function updateChartDisplay() {
    // Extract labels and values from sorted points
    const labels = journeyData.points.map(point => point.milestone);
    const values = journeyData.points.map(point => point.value);
    
    // Update chart data
    emotionChart.data.labels = labels;
    emotionChart.data.datasets[0].data = values;
    emotionChart.data.datasets[0].label = capitalizeFirstLetter(journeyData.metric);
    
    // Update y-axis title
    emotionChart.options.scales.y.title.text = capitalizeFirstLetter(journeyData.metric) + ' Level';
    
    // Add annotations for points with notes
    const annotations = {};
    journeyData.points.forEach((point, index) => {
        if (point.annotation) {
            annotations['note' + index] = {
                type: 'label',
                xValue: index,
                yValue: point.value,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                content: point.annotation,
                font: {
                    size: 12
                },
                padding: 6,
                position: {
                    y: 'top'
                },
                yAdjust: -20,
                borderRadius: 4
            };
        }
    });
    
    emotionChart.options.plugins.annotation.annotations = annotations;
    
    // Update chart
    emotionChart.update();
}

// Display all data points in the list
function updatePointsList() {
    pointsList.innerHTML = '';
    
    journeyData.points.forEach((point, index) => {
        const li = document.createElement('li');
        li.className = 'point-item';
        
        li.innerHTML = `
            <div>
                <strong>${point.milestone}:</strong> 
                ${point.value}/10
                ${point.annotation ? `<br><em>${point.annotation}</em>` : ''}
            </div>
            <div class="point-actions">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
        `;
        
        pointsList.appendChild(li);
    });
    
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
    if (confirm('Are you sure you want to delete this point?')) {
        journeyData.points.splice(index, 1);
        updateChartDisplay();
        updatePointsList();
    }
}

// Edit a data point
function editPoint(index) {
    const point = journeyData.points[index];
    
    milestoneInput.value = point.milestone;
    valueInput.value = point.value;
    valueDisplay.textContent = point.value;
    annotationInput.value = point.annotation || '';
    
    // Remove the old point
    journeyData.points.splice(index, 1);
    
    // Update display
    updateChartDisplay();
    updatePointsList();
    
    // Scroll to data entry section
    document.querySelector('.data-entry').scrollIntoView({ behavior: 'smooth' });
}

// Save journey data to localStorage
function saveJourney() {
    localStorage.setItem('emotionJourney', JSON.stringify(journeyData));
    alert('Journey saved successfully!');
}

// Load journey data from localStorage
function loadJourney() {
    const savedData = localStorage.getItem('emotionJourney');
    
    if (savedData) {
        journeyData = JSON.parse(savedData);
        metricSelect.value = journeyData.metric;
        updateChartDisplay();
        updatePointsList();
        alert('Journey loaded successfully!');
    } else {
        alert('No saved journey found.');
    }
}

// Helper function to capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);