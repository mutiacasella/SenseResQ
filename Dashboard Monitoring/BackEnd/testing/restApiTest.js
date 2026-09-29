const axios = require("axios");
const { performance } = require("perf_hooks");

const API_URL = "http://localhost:7777";

const TEST_COUNT = 100;

// Endpoint yang digunakan oleh dashboard
const ENDPOINTS = [
    {
        name: "Dashboard Volunteers",
        method: "GET",
        path: "/dashboard/volunteers",
    },
    {
        name: "Alerts",
        method: "GET",
        path: "/alert",
    },
];

// Statistik latency
function calculateStats(values) {
    if (values.length === 0) {
        return {
            average: 0,
            minimum: 0,
            maximum: 0,
            p95: 0,
        };
    }

    const sorted = [...values].sort((a, b) => a - b);

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const p95Index = Math.ceil(0.95 * sorted.length) - 1;
    const p95 = sorted[Math.max(0, p95Index)];

    return {
        average,
        minimum,
        maximum,
        p95,
    };
}

// Pengujian endpoint
async function testEndpoint(endpoint) {
    const latencies = [];

    let success = 0;
    let error = 0;

    console.log("");
    console.log("=================================");
    console.log(`TEST: ${endpoint.name}`);
    console.log("=================================");
    console.log(`Method   : ${endpoint.method}`);
    console.log(`Endpoint : ${endpoint.path}`);
    console.log(`Request  : ${TEST_COUNT}`);
    console.log("");

    for (let i = 1; i <= TEST_COUNT; i++) {
        const start = performance.now();

        try {
            const response = await axios.get(
                `${API_URL}${endpoint.path}`
            );

            const end = performance.now();
            const latency = end - start;

            // HTTP 2xx dianggap berhasil
            if (response.status >= 200 && response.status < 300) {
                success++;
                latencies.push(latency);

                console.log(`[${i}/${TEST_COUNT}] SUCCESS ${latency.toFixed(2)}ms`);
            }
            else {
                error++;

                console.log(`[${i}/${TEST_COUNT}] ERROR HTTP ${response.status}`);
            }

        }
        catch (err) {
            error++;

            const end = performance.now();
            const latency = end - start;

            console.log(`[${i}/${TEST_COUNT}] ERROR ${latency.toFixed(2)}ms`);
        }
    }

    const stats = calculateStats(latencies);

    console.log("");
    console.log("---------------------------------");
    console.log("HASIL");
    console.log("---------------------------------");
    console.log(`Jumlah request : ${TEST_COUNT}`);
    console.log(`Success        : ${success}`);
    console.log(`Error          : ${error}`);
    console.log(`Average        : ${stats.average.toFixed(2)} ms`);
    console.log(`Minimum        : ${stats.minimum.toFixed(2)} ms`);
    console.log(`Maximum        : ${stats.maximum.toFixed(2)} ms`);
    console.log(`P95            : ${stats.p95.toFixed(2)} ms`);

    return {
        endpoint: endpoint.path,
        method: endpoint.method,
        total: TEST_COUNT,
        success,
        error,
        average: stats.average,
        minimum: stats.minimum,
        maximum: stats.maximum,
        p95: stats.p95,
    };
}

// Main test
async function main() {
    console.log("=================================");
    console.log("      SENSERESQ REST API TEST");
    console.log("=================================");
    console.log(`Server       : ${API_URL}`);
    console.log(`Request/API  : ${TEST_COUNT}`);
    console.log("");

    const results = [];

    for (const endpoint of ENDPOINTS) {
        const result = await testEndpoint(endpoint);

        results.push(result);
    }

    // Hasil akhir
    console.log("");
    console.log("=================================");
    console.log("       HASIL AKHIR REST API");
    console.log("=================================");
    console.log("");

    results.forEach((result) => {
        console.log(`Endpoint : ${result.endpoint}`);
        console.log(`Method   : ${result.method}`);
        console.log(`Request  : ${result.total}`);
        console.log(`Success  : ${result.success}`);
        console.log(`Error    : ${result.error}`);
        console.log(`Average  : ${result.average.toFixed(2)} ms`);
        console.log(`Min      : ${result.minimum.toFixed(2)} ms`);
        console.log(`Max      : ${result.maximum.toFixed(2)} ms`);
        console.log(`P95      : ${result.p95.toFixed(2)} ms`);
        console.log("---------------------------------");
    });
}

main();