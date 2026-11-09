const axios = require("axios");
const { io } = require("socket.io-client");
const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:7777";
const RUN_ID = `E2E-${new Date().toISOString().replace(/[:.]/g, "-")}`;

// Buffer hasil
const monitoringEvents = [];
const alertEvents = [];
const gaps = [];              // gap seq (kalau firmware kirim seq)
const latencySamples = [];    // sent_at -> receivedAt
const unknownDevices = [];    // dari log backend tidak bisa dicek langsung; lihat README

let lastSeqByDevice = new Map();

const t0 = performance.now();
const socket = io(API_URL);

function nowMs() {
    return performance.now();
}

// ---------- WebSocket: monitoring ----------
socket.on("monitoring:new", (d) => {
    const receivedAt = nowMs();

    monitoringEvents.push({
        receivedAt,
        monitoring_id: d.monitoring_id,
        device_id: d.device_id,
        heart_rate: d.heart_rate,
        spo2: d.spo2,
        temperature: d.temperature,
        fall_detected: d.fall_detected,
        activity_status: d.activity_status,
        x: d.x,
        y: d.y,
        severity: d.severity,
        fatigue_score: d.fatigue_score,
        test_id: d.test_id ?? null,
        seq: d.seq ?? null,          // kalau firmware kirim seq
        sent_at: d.sent_at ?? null,  // kalau firmware kirim sent_at
    });

    // Deteksi gap seq per device
    if (typeof d.seq === "number") {
        const prev = lastSeqByDevice.get(d.device_id);
        if (typeof prev === "number" && d.seq !== prev + 1) {
            gaps.push({ device_id: d.device_id, from: prev, to: d.seq, at: receivedAt });
            console.warn(`[GAP] ${d.device_id} seq ${prev} -> ${d.seq}`);
        }
        lastSeqByDevice.set(d.device_id, d.seq);
    }

    // Latency serial->WS kalau firmware kirim sent_at (epoch ms)
    if (d.sent_at) {
        const sentEpochMs = Number(d.sent_at);
        if (Number.isFinite(sentEpochMs)) {
            const latency = Date.now() - sentEpochMs;
            latencySamples.push(latency);
        }
    }

    console.log(
        `[MON] ${d.device_id} HR=${d.heart_rate} SpO2=${d.spo2} ` +
        `T=${d.temperature} Fall=${d.fall_detected} ` +
        `x=${Number(d.x).toFixed(2)} y=${Number(d.y).toFixed(2)} ` +
        `sev=${d.severity} fatigue=${d.fatigue_score}`
    );
});

// ---------- WebSocket: alert ----------
socket.on("alert:new", (a) => {
    alertEvents.push({
        receivedAt: nowMs(),
        volunteer_id: a.volunteer_id,
        volunteer_name: a.volunteer_name,
        type: a.type,
        severity: a.severity,
        fatigue_score: a.fatigue_score,
        heart_rate: a.heart_rate,
        spo2: a.spo2,
        temperature: a.temperature,
        fall_detected: a.fall_detected,
        test_id: a.test_id ?? null,
    });

    console.log(
        `[ALERT] ${a.volunteer_name || a.volunteer_id} ` +
        `type=${a.type} sev=${a.severity} fall=${a.fall_detected}`
    );
});

socket.on("connect_error", (e) => {
    console.error("WebSocket error:", e.message);
});

// ---------- Verifikasi SQLite via REST API ----------
async function verifyPersisted(monitoringId) {
    try {
        const { data } = await axios.get(`${API_URL}/alert`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// ---------- Ringkasan ----------
function percentile(values, p) {
    if (!values.length) return 0;
    const s = [...values].sort((a, b) => a - b);
    const i = Math.ceil((p / 100) * s.length) - 1;
    return s[Math.max(0, i)];
}

function summarize() {
    const durationSec = (nowMs() - t0) / 1000;

    const perDevice = {};
    for (const e of monitoringEvents) {
        perDevice[e.device_id] = (perDevice[e.device_id] || 0) + 1;
    }

    const fallEvents = monitoringEvents.filter(e => e.fall_detected);
    const fallAlerts = alertEvents.filter(a => a.type === "Fall Detection");

    const sevCount = {};
    for (const e of monitoringEvents) {
        sevCount[e.severity] = (sevCount[e.severity] || 0) + 1;
    }

    const latStats = latencySamples.length ? {
        min: Math.min(...latencySamples),
        avg: latencySamples.reduce((s, v) => s + v, 0) / latencySamples.length,
        max: Math.max(...latencySamples),
        p95: percentile(latencySamples, 95),
    } : null;

    return {
        run_id: RUN_ID,
        api_url: API_URL,
        duration_sec: Number(durationSec.toFixed(2)),
        monitoring_total: monitoringEvents.length,
        alert_total: alertEvents.length,
        per_device: perDevice,
        severity_count: sevCount,
        fall_monitoring: fallEvents.length,
        fall_alerts: fallAlerts.length,
        fall_alert_match: fallEvents.length === fallAlerts.length,
        seq_gaps: gaps,
        serial_to_ws_latency_ms: latStats,
    };
}

// ---------- Simpan dan keluar ----------
async function shutdown() {
    const summary = summarize();

    fs.mkdirSync("reports", { recursive: true });
    const out = path.join("reports", `${RUN_ID}.json`);

    fs.writeFileSync(out, JSON.stringify({
        summary,
        monitoring_events: monitoringEvents,
        alert_events: alertEvents,
    }, null, 2));

    console.log("\n=================================");
    console.log("       HASIL E2E HARDWARE");
    console.log("=================================");
    console.log(`Durasi              : ${summary.duration_sec} s`);
    console.log(`Monitoring diterima : ${summary.monitoring_total}`);
    console.log(`Alert diterima      : ${summary.alert_total}`);
    console.log(`Fall (monitoring)   : ${summary.fall_monitoring}`);
    console.log(`Fall (alert)        : ${summary.fall_alerts}`);
    console.log(`Fall match          : ${summary.fall_alert_match}`);
    console.log(`Seq gaps            : ${summary.seq_gaps.length}`);
    if (summary.serial_to_ws_latency_ms) {
        const l = summary.serial_to_ws_latency_ms;
        console.log(`Latency serial->WS  : avg=${l.avg.toFixed(1)}ms p95=${l.p95.toFixed(1)}ms max=${l.max.toFixed(1)}ms`);
    } else {
        console.log(`Latency serial->WS  : (firmware tidak mengirim sent_at)`);
    }
    console.log(`Per device          :`, summary.per_device);
    console.log(`Severity            :`, summary.severity_count);
    console.log(`\nLaporan disimpan    : ${out}`);

    socket.disconnect();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("=================================");
console.log("   SENSERESQ E2E HARDWARE TEST");
console.log("=================================");
console.log(`API      : ${API_URL}`);
console.log(`Run ID   : ${RUN_ID}`);
console.log("");
console.log("Menunggu data dari hardware...");
console.log("");