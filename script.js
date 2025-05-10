console.log("Script cargado correctamente");

// URL del archivo CSV
const urlCSV = "https://raw.githubusercontent.com/rudyluis/DashboardJS/main/global_cancer.csv";

// Variables globales para almacenar los datos
let globalCancerData = [];
let processedData = {};

$(document).ready(function() {
    // Cargar los datos del CSV
    cargarDatosCSV();
});

function cargarDatosCSV() {
    $.ajax({
        url: urlCSV,
        dataType: "text",
        success: function(data) {
            procesarDatosCSV(data);
            inicializarDataTable();
            inicializarGraficos();
            $('#loadingMessage').hide();
        },
        error: function(xhr, status, error) {
            console.error("Error al cargar el archivo:", error);
            $('#loadingMessage').html('<div class="error">Error al cargar los datos. Por favor intente más tarde.</div>');
        }
    });
}

function procesarDatosCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    // Limitar a 2000 filas para mejor rendimiento
    const maxRows = Math.min(2000, lines.length - 1);
    
    for (let i = 1; i < maxRows; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length === headers.length) {
            globalCancerData.push({
                country: currentLine[0],
                cancerType: currentLine[1],
                sex: currentLine[2],
                year: parseInt(currentLine[3]),
                cases: parseFloat(currentLine[4]),
                deaths: parseFloat(currentLine[5])
            });
        }
    }
    
    // Procesar datos para gráficos
    processedData = {
        countries: {},
        cancerTypes: {},
        years: {},
        sexes: {
            'Male': {cases: 0, deaths: 0},
            'Female': {cases: 0, deaths: 0},
            'Both sexes': {cases: 0, deaths: 0}
        }
    };
    
    globalCancerData.forEach(item => {
        // Por país
        if (!processedData.countries[item.country]) {
            processedData.countries[item.country] = {cases: 0, deaths: 0};
        }
        processedData.countries[item.country].cases += item.cases;
        processedData.countries[item.country].deaths += item.deaths;
        
        // Por tipo de cáncer
        if (!processedData.cancerTypes[item.cancerType]) {
            processedData.cancerTypes[item.cancerType] = {cases: 0, deaths: 0};
        }
        processedData.cancerTypes[item.cancerType].cases += item.cases;
        processedData.cancerTypes[item.cancerType].deaths += item.deaths;
        
        // Por año
        if (!processedData.years[item.year]) {
            processedData.years[item.year] = {cases: 0, deaths: 0};
        }
        processedData.years[item.year].cases += item.cases;
        processedData.years[item.year].deaths += item.deaths;
        
        // Por sexo
        if (processedData.sexes[item.sex]) {
            processedData.sexes[item.sex].cases += item.cases;
            processedData.sexes[item.sex].deaths += item.deaths;
        }
    });
}

function inicializarDataTable() {
    $('#cancerTable').DataTable({
        data: globalCancerData,
        columns: [
            { data: 'country', title: 'País' },
            { data: 'cancerType', title: 'Tipo de Cáncer' },
            { data: 'sex', title: 'Sexo' },
            { data: 'year', title: 'Año' },
            { 
                data: 'cases', 
                title: 'Casos',
                render: function(data, type, row) {
                    return data.toLocaleString();
                }
            },
            { 
                data: 'deaths', 
                title: 'Muertes',
                render: function(data, type, row) {
                    return data.toLocaleString();
                }
            }
        ],
        pageLength: 25,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        }
    });
}

function inicializarGraficos() {
    // Gráfico 1: Casos de Cáncer por País (Top 10)
    const topCountries = Object.entries(processedData.countries)
        .sort((a, b) => b[1].cases - a[1].cases)
        .slice(0, 10);
    
    crearGraficoBarras('chart1', 
        topCountries.map(item => item[0]),
        topCountries.map(item => item[1].cases),
        'Casos de cáncer por país (Top 10)',
        'rgb(75, 192, 192)'
    );
    
    // Gráfico 2: Distribución por Tipo de Cáncer
    const cancerTypes = Object.entries(processedData.cancerTypes)
        .sort((a, b) => b[1].cases - a[1].cases);
    
    crearGraficoPastel('chart2', 
        cancerTypes.map(item => item[0]),
        cancerTypes.map(item => item[1].cases),
        'Distribución por tipo de cáncer'
    );
    
    // Gráfico 3: Muertes por Región (simplificado usando países como regiones)
    crearGraficoBarras('chart3', 
        topCountries.map(item => item[0]),
        topCountries.map(item => item[1].deaths),
        'Muertes por país (Top 10)',
        'rgb(255, 99, 132)'
    );
    
    // Gráfico 4: Proporción por Género
    const sexes = Object.entries(processedData.sexes);
    crearGraficoDona('chart4', 
        sexes.map(item => item[0]),
        sexes.map(item => item[1].cases),
        'Proporción de casos por género'
    );
    
    // Gráfico 5: Tendencias Anuales
    const years = Object.keys(processedData.years).sort();
    crearGraficoLineas('chart5', 
        years,
        years.map(year => processedData.years[year].cases),
        years.map(year => processedData.years[year].deaths),
        'Tendencias anuales de casos y muertes'
    );
    
    // Gráfico 6: Top 10 Países con Más Casos (similar al 1 pero horizontal)
    crearGraficoBarrasHorizontales('chart6', 
        topCountries.map(item => item[0]),
        topCountries.map(item => item[1].cases),
        'Top 10 países con más casos',
        'rgb(54, 162, 235)'
    );
    
    // Gráfico 7: Relación Casos vs Muertes
    crearGraficoDispersion('chart7', 
        globalCancerData.slice(0, 100).map(item => item.cases),
        globalCancerData.slice(0, 100).map(item => item.deaths),
        'Relación entre casos y muertes'
    );
    
    // Gráfico 8: Distribución por Región (similar al 3 pero con doughnut)
    crearGraficoDona('chart8', 
        topCountries.map(item => item[0]),
        topCountries.map(item => item[1].cases),
        'Distribución de casos por país'
    );
    
    // Gráfico 9: Tipos de Cáncer por Género
    crearGraficoBarrasAgrupadas('chart9', 
        cancerTypes.slice(0, 5).map(item => item[0]),
        ['Male', 'Female'],
        cancerTypes.slice(0, 5).map(type => {
            const maleData = globalCancerData
                .filter(item => item.cancerType === type[0] && item.sex === 'Male')
                .reduce((sum, item) => sum + item.cases, 0);
            const femaleData = globalCancerData
                .filter(item => item.cancerType === type[0] && item.sex === 'Female')
                .reduce((sum, item) => sum + item.cases, 0);
            return [maleData, femaleData];
        }),
        'Tipos de cáncer por género'
    );
    
    // Gráfico 10: Mortalidad por Tipo de Cáncer
    crearGraficoBarras('chart10', 
        cancerTypes.map(item => item[0]),
        cancerTypes.map(item => (item[1].deaths / item[1].cases * 100).toFixed(2),
        'Tasa de mortalidad por tipo de cáncer (%)',
        'rgb(153, 102, 255)'
    );
}

// Funciones auxiliares para crear diferentes tipos de gráficos
function crearGraficoBarras(canvasId, labels, data, label, backgroundColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoBarrasHorizontales(canvasId, labels, data, label, backgroundColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoPastel(canvasId, labels, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(201, 203, 207)',
                    'rgb(102, 187, 106)',
                    'rgb(220, 57, 18)',
                    'rgb(255, 153, 0)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoDona(canvasId, labels, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoLineas(canvasId, labels, data1, data2, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Casos',
                    data: data1,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Muertes',
                    data: data2,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoDispersion(canvasId, xValues, yValues, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Casos vs Muertes',
                data: xValues.map((x, i) => ({x: x, y: yValues[i]})),
                backgroundColor: 'rgb(255, 99, 132)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Casos: ${context.parsed.x.toLocaleString()}, Muertes: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Casos'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Muertes'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoBarrasAgrupadas(canvasId, labels, groups, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const datasets = groups.map((group, i) => ({
        label: group,
        data: data.map(item => item[i]),
        backgroundColor: i === 0 ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
        borderColor: i === 0 ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
        borderWidth: 1
    }));
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}