"use client";

import { X, Hash, Calendar, Clock, User as UserIcon } from "lucide-react";
import type { TransactionInterface } from "@/interface/transaction";
import {
    TYPE_CONFIG, STATUS_CONFIG, USER_MODEL_CONFIG,
    CURRENCY_CONFIG, getCurrencyConfig,
    avatarGradient, getInitials, getUserName, getUserEmail,
    getAdminName, formatCurrencyAmount, formatDateTime,
} from "./types";

/* ─────────────────────────────────────────────
   CSS keyframes injected once (prefixed "tx_")
───────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes tx_modalIn {
  from { opacity:0; transform:scale(.94) translateY(12px); }
  to   { opacity:1; transform:scale(1)   translateY(0); }
}
/* coin / object drop */
@keyframes tx_coinFall {
  0%   { transform:translateX(-50%) translateY(-70px) rotateY(0deg);    opacity:0; }
  15%  { opacity:1; }
  70%  { transform:translateX(-50%) translateY(52px)  rotateY(540deg);  opacity:1; }
  85%  { transform:translateX(-50%) translateY(52px)  rotateY(630deg);  opacity:.6; }
  100% { transform:translateX(-50%) translateY(52px)  rotateY(720deg);  opacity:0; }
}
@keyframes tx_coinFall2 {
  0%   { transform:translateX(-50%) translateY(-70px) rotateY(0deg);    opacity:0; }
  15%  { opacity:1; }
  70%  { transform:translateX(-50%) translateY(52px)  rotateY(-540deg); opacity:1; }
  85%  { transform:translateX(-50%) translateY(52px)  rotateY(-630deg); opacity:.6; }
  100% { transform:translateX(-50%) translateY(52px)  rotateY(-720deg); opacity:0; }
}
/* vault / sink pulse */
@keyframes tx_vaultPulse {
  0%,100% { box-shadow:0 0 18px 4px rgba(16,185,129,.45); transform:translateX(-50%) scale(1); }
  50%     { box-shadow:0 0 36px 14px rgba(16,185,129,.65); transform:translateX(-50%) scale(1.08); }
}
/* burst particles */
@keyframes tx_burst0   { to { transform:translate(-32px,-28px) scale(0); opacity:0; } }
@keyframes tx_burst1   { to { transform:translate(  0px,-40px) scale(0); opacity:0; } }
@keyframes tx_burst2   { to { transform:translate( 32px,-28px) scale(0); opacity:0; } }
@keyframes tx_burst3   { to { transform:translate( 42px,  4px) scale(0); opacity:0; } }
@keyframes tx_burst4   { to { transform:translate( 32px, 32px) scale(0); opacity:0; } }
@keyframes tx_burst5   { to { transform:translate(-32px, 32px) scale(0); opacity:0; } }
@keyframes tx_burst6   { to { transform:translate(-42px,  4px) scale(0); opacity:0; } }

/* coin rise (withdrawal) */
@keyframes tx_coinRise {
  0%   { transform:translateX(-50%) translateY(56px)  rotateY(0deg);    opacity:0; }
  15%  { opacity:1; }
  75%  { transform:translateX(-50%) translateY(-64px) rotateY(540deg);  opacity:1; }
  100% { transform:translateX(-50%) translateY(-80px) rotateY(720deg);  opacity:0; }
}
@keyframes tx_coinRise2 {
  0%   { transform:translateX(-50%) translateY(56px)  rotateY(0deg);    opacity:0; }
  15%  { opacity:1; }
  75%  { transform:translateX(-50%) translateY(-64px) rotateY(-540deg); opacity:1; }
  100% { transform:translateX(-50%) translateY(-80px) rotateY(-720deg); opacity:0; }
}
/* drain effect at bottom */
@keyframes tx_drainPulse {
  0%,100% { box-shadow:0 0 18px 4px rgba(244,63,94,.4); transform:translateX(-50%) scale(1); }
  50%     { box-shadow:0 0 34px 14px rgba(244,63,94,.6); transform:translateX(-50%) scale(1.08); }
}
/* upward arrow trail */
@keyframes tx_arrowUp {
  0%   { transform:translateX(-50%) translateY(20px); opacity:0; }
  30%  { opacity:1; }
  100% { transform:translateX(-50%) translateY(-50px); opacity:0; }
}

/* investment bars */
@keyframes tx_barGrow0 { from { transform:scaleY(0); } to { transform:scaleY(1); } }
@keyframes tx_barGrow1 { from { transform:scaleY(0); } to { transform:scaleY(1); } }
@keyframes tx_barGrow2 { from { transform:scaleY(0); } to { transform:scaleY(1); } }
@keyframes tx_barGrow3 { from { transform:scaleY(0); } to { transform:scaleY(1); } }
@keyframes tx_barGrow4 { from { transform:scaleY(0); } to { transform:scaleY(1); } }
/* trend line draw */
@keyframes tx_lineDraw {
  from { stroke-dashoffset:260; }
  to   { stroke-dashoffset:0; }
}
/* floating arrow */
@keyframes tx_trendArrow {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-6px); }
}

/* earning: coin perpetual spin */
@keyframes tx_goldSpin {
  from { transform:rotateY(0deg); }
  to   { transform:rotateY(360deg); }
}
/* sparkles */
@keyframes tx_spark0 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate(-48px,-48px) scale(0);opacity:0;} }
@keyframes tx_spark1 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate(  0px,-64px) scale(0);opacity:0;} }
@keyframes tx_spark2 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate( 48px,-48px) scale(0);opacity:0;} }
@keyframes tx_spark3 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate( 64px,  0px) scale(0);opacity:0;} }
@keyframes tx_spark4 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate( 48px, 48px) scale(0);opacity:0;} }
@keyframes tx_spark5 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate(  0px, 64px) scale(0);opacity:0;} }
@keyframes tx_spark6 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate(-48px, 48px) scale(0);opacity:0;} }
@keyframes tx_spark7 { 0%{transform:translate( 0px,   0px) scale(1);opacity:1;} 100%{transform:translate(-64px,  0px) scale(0);opacity:0;} }
/* float + signs */
@keyframes tx_floatPlus {
  0%   { opacity:0; transform:translateY(0) scale(.6); }
  20%  { opacity:1; transform:translateY(-10px) scale(1); }
  100% { opacity:0; transform:translateY(-40px) scale(.6); }
}
/* penalty */
@keyframes tx_penaltyPulse {
  0%,100% { box-shadow:0 0 20px 6px rgba(239,68,68,.5); transform:scale(1); }
  50%     { box-shadow:0 0 44px 18px rgba(239,68,68,.78); transform:scale(1.12); }
}
@keyframes tx_penaltyMinus {
  0%   { opacity:0; transform:translateY(0) scale(.6); }
  20%  { opacity:1; transform:translateY(-10px) scale(1); }
  100% { opacity:0; transform:translateY(-40px) scale(.6); }
}
/* charge */
@keyframes tx_chargePulse {
  0%,100% { box-shadow:0 0 20px 6px rgba(249,115,22,.45); transform:scale(1); }
  50%     { box-shadow:0 0 42px 16px rgba(249,115,22,.7); transform:scale(1.1); }
}
@keyframes tx_chargePct {
  0%   { opacity:0; transform:translateY(0) scale(.6); }
  20%  { opacity:1; transform:translateY(-10px) scale(1); }
  100% { opacity:0; transform:translateY(-40px) scale(.6); }
}
`;

/* ─── animation scenes ─── */

const COIN_STYLE = (bg: string, color: string, symbol: string, anim: string, delay: string): React.CSSProperties => ({
    position: "absolute", width: 38, height: 38,
    borderRadius: "50%",
    background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, fontWeight: 900, color,
    boxShadow: "-4px 0 12px rgba(0,0,0,.5), inset -8px 0 16px rgba(0,0,0,.25)",
    animation: `${anim} 1.6s ${delay} ease-in-out infinite`,
    perspective: "300px",
    transformOrigin: "center",
});

const COIN_GOLD = "linear-gradient(135deg,#fde68a 0%,#fbbf24 40%,#d97706 60%,#92400e 100%)";
const COIN_SILVER = "linear-gradient(135deg,#e2e8f0 0%,#94a3b8 40%,#475569 60%,#1e293b 100%)";

function DepositScene({ symbol }: { symbol: string }) {
    const BURSTS = ["tx_burst0", "tx_burst1", "tx_burst2", "tx_burst3", "tx_burst4", "tx_burst5", "tx_burst6"];
    return (
        <div style={{
            position: "relative", height: "100%", overflow: "hidden",
            background: "radial-gradient(ellipse 80% 60% at 50% 100%,rgba(16,185,129,.28) 0%,rgba(2,26,20,.0) 70%),#0f172a"
        }}>

            {/* falling coins */}
            {[{ l: "38%", a: "tx_coinFall", d: "0s" }, { l: "50%", a: "tx_coinFall2", d: ".22s" }, { l: "62%", a: "tx_coinFall", d: ".44s" }].map((c, i) => (
                <div key={i} style={{ ...COIN_STYLE(COIN_GOLD, "#7c2d12", symbol, c.a, c.d), left: c.l, top: 0 }} >
                    {symbol}
                </div>
            ))}

            {/* vault */}
            <div style={{
                position: "absolute", bottom: 16, left: "50%",
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(16,185,129,.12)",
                border: "2px solid rgba(16,185,129,.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
                animation: "tx_vaultPulse 1.8s ease-in-out infinite"
            }}>
                🏦
            </div>

            {/* burst particles */}
            {BURSTS.map((anim, i) => (
                <div key={i} style={{
                    position: "absolute", bottom: 38, left: "calc(50% - 2px)",
                    width: 4, height: 4, borderRadius: "50%",
                    background: `hsl(${150 + i * 10},80%,60%)`,
                    animation: `${anim} 1.4s ${i * .1}s ease-out infinite`
                }} />
            ))}

            {/* label */}
            <p style={{
                position: "absolute", bottom: 6, left: 0, right: 0,
                textAlign: "center", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", color: "rgba(52,211,153,.7)", textTransform: "uppercase"
            }}>
                Incoming
            </p>
        </div>
    );
}

function WithdrawalScene({ symbol }: { symbol: string }) {
    const BURSTS = ["tx_burst0", "tx_burst1", "tx_burst2", "tx_burst3", "tx_burst4", "tx_burst5", "tx_burst6"];
    return (
        <div style={{
            position: "relative", height: "100%", overflow: "hidden",
            background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(244,63,94,.28) 0%,rgba(20,2,8,0) 70%),#0f172a"
        }}>

            {/* rising coins */}
            {[{ l: "38%", a: "tx_coinRise", d: "0s" }, { l: "50%", a: "tx_coinRise2", d: ".22s" }, { l: "62%", a: "tx_coinRise", d: ".44s" }].map((c, i) => (
                <div key={i} style={{ ...COIN_STYLE(COIN_SILVER, "#0f172a", symbol, c.a, c.d), left: c.l, bottom: 0 }}>
                    {symbol}
                </div>
            ))}

            {/* drain portal at bottom */}
            <div style={{
                position: "absolute", bottom: 16, left: "50%",
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(244,63,94,.1)",
                border: "2px solid rgba(244,63,94,.65)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
                animation: "tx_drainPulse 1.8s ease-in-out infinite"
            }}>
                💸
            </div>

            {/* burst particles at drain */}
            {BURSTS.map((anim, i) => (
                <div key={i} style={{
                    position: "absolute", bottom: 38, left: "calc(50% - 2px)",
                    width: 4, height: 4, borderRadius: "50%",
                    background: `hsl(${350 + i * 8},80%,65%)`,
                    animation: `${anim} 1.4s ${i * .1}s ease-out infinite`
                }} />
            ))}

            {/* upward arrow */}
            <div style={{
                position: "absolute", left: "50%",
                animation: "tx_arrowUp 1.6s .3s ease-in-out infinite"
            }}>
                <svg width="20" height="36" viewBox="0 0 20 36" fill="none">
                    <path d="M10 34 L10 4 M10 4 L3 12 M10 4 L17 12"
                        stroke="rgba(251,113,133,.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <p style={{
                position: "absolute", top: 6, left: 0, right: 0,
                textAlign: "center", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", color: "rgba(251,113,133,.7)", textTransform: "uppercase"
            }}>
                Outgoing
            </p>
        </div>
    );
}

const BAR_HEIGHTS = [40, 62, 50, 80, 68];
const BAR_DELAYS = ["0s", ".12s", ".24s", ".36s", ".48s"];
const BAR_ANIMS = ["tx_barGrow0", "tx_barGrow1", "tx_barGrow2", "tx_barGrow3", "tx_barGrow4"];

function InvestmentScene() {
    const W = 240; const H = 120; const pad = 20;
    // bar positions
    const bw = 22; const gap = 12;
    const totalBarW = BAR_HEIGHTS.length * bw + (BAR_HEIGHTS.length - 1) * gap;
    const startX = (W - totalBarW) / 2;
    const baseY = H - pad;
    // line points (top-center of each bar)
    const pts = BAR_HEIGHTS.map((h, i) => ({ x: startX + i * (bw + gap) + bw / 2, y: baseY - h }));
    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const lineLen = pts.reduce((acc, p, i) => i === 0 ? acc : acc + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y), 0);

    return (
        <div style={{
            position: "relative", height: "100%", overflow: "hidden",
            background: "radial-gradient(ellipse 80% 70% at 60% 60%,rgba(59,130,246,.22) 0%,rgba(2,8,23,0) 70%),#0f172a"
        }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
                {/* grid baseline */}
                <line x1={startX - 8} y1={baseY} x2={startX + totalBarW + 8} y2={baseY}
                    stroke="rgba(148,163,184,.25)" strokeWidth="1" />

                {/* bars */}
                {BAR_HEIGHTS.map((h, i) => {
                    const x = startX + i * (bw + gap);
                    return (
                        <g key={i}>
                            {/* bar bg */}
                            <rect x={x} y={baseY - h} width={bw} height={h} rx="4"
                                fill={`rgba(59,130,246,${.18 + i * .06})`}
                                stroke="rgba(96,165,250,.4)" strokeWidth="1"
                                style={{
                                    transformOrigin: `${x + bw / 2}px ${baseY}px`,
                                    animation: `${BAR_ANIMS[i]} .7s ${BAR_DELAYS[i]} cubic-bezier(.34,1.4,.64,1) both`
                                }} />
                            {/* glow top */}
                            <rect x={x + 2} y={baseY - h} width={bw - 4} height={4} rx="2"
                                fill="rgba(147,197,253,.9)"
                                style={{
                                    transformOrigin: `${x + bw / 2}px ${baseY}px`,
                                    animation: `${BAR_ANIMS[i]} .7s ${BAR_DELAYS[i]} cubic-bezier(.34,1.4,.64,1) both`
                                }} />
                        </g>
                    );
                })}

                {/* trend line */}
                <path d={linePath} fill="none"
                    stroke="rgba(96,165,250,.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray={lineLen} strokeDashoffset={lineLen}
                    style={{ animation: `tx_lineDraw .8s .6s ease-out forwards` }} />

                {/* dots on line */}
                {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4"
                        fill="#0f172a" stroke="rgba(147,197,253,.9)" strokeWidth="2"
                        style={{
                            transformOrigin: `${p.x}px ${p.y}px`,
                            animation: `${BAR_ANIMS[i]} .7s ${BAR_DELAYS[i]} cubic-bezier(.34,1.4,.64,1) both`
                        }} />
                ))}

                {/* floating arrow at last point */}
                <g style={{ animation: "tx_trendArrow 1.6s .8s ease-in-out infinite" }}>
                    <path d={`M ${pts[4].x} ${pts[4].y - 8} L ${pts[4].x + 8} ${pts[4].y - 20} L ${pts[4].x + 16} ${pts[4].y - 8}`}
                        fill="none" stroke="rgba(96,165,250,.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1={pts[4].x + 8} y1={pts[4].y - 20} x2={pts[4].x + 8} y2={pts[4].y - 32}
                        stroke="rgba(96,165,250,.95)" strokeWidth="2.5" strokeLinecap="round" />
                </g>
            </svg>

            <p style={{
                position: "absolute", bottom: 5, left: 0, right: 0,
                textAlign: "center", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", color: "rgba(147,197,253,.7)", textTransform: "uppercase"
            }}>
                Growing
            </p>
        </div>
    );
}

const SPARK_COLORS = ["#fbbf24", "#fde68a", "#f59e0b", "#fcd34d", "#fbbf24", "#fef3c7", "#f59e0b", "#fde68a"];
const SPARK_ANIMS = ["tx_spark0", "tx_spark1", "tx_spark2", "tx_spark3", "tx_spark4", "tx_spark5", "tx_spark6", "tx_spark7"];
const SPARK_SHAPES = ["★", "✦", "◆", "✦", "★", "◆", "✦", "★"];
const FLOAT_DELAYS = ["0s", ".5s", "1s", "1.5s"];
const FLOAT_LEFTS = ["38%", "46%", "54%", "62%"];

function EarningScene({ symbol }: { symbol: string }) {
    return (
        <div style={{
            position: "relative", height: "100%", overflow: "hidden",
            background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(251,191,36,.22) 0%,rgba(20,16,0,0) 65%),#0f172a",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>

            {/* sparkles ring */}
            {SPARK_ANIMS.map((anim, i) => (
                <div key={i} style={{
                    position: "absolute",
                    left: "calc(50% - 6px)", top: "calc(50% - 6px)",
                    width: 12, height: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: SPARK_COLORS[i], fontWeight: 900,
                    animation: `${anim} 1.6s ${(i * .18).toFixed(2)}s ease-out infinite`
                }}>
                    {SPARK_SHAPES[i]}
                </div>
            ))}

            {/* spinning 3D gold coin */}
            <div style={{ perspective: "260px", zIndex: 2 }}>
                <div style={{
                    width: 68, height: 68, borderRadius: "50%",
                    background: "linear-gradient(135deg,#fef3c7 0%,#fbbf24 30%,#d97706 55%,#92400e 80%,#451a03 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, fontWeight: 900,
                    color: "rgba(120,53,15,.9)",
                    boxShadow: "-6px 0 18px rgba(0,0,0,.6), inset -12px 0 24px rgba(0,0,0,.2), 0 0 20px rgba(251,191,36,.5)",
                    animation: "tx_goldSpin 2s linear infinite",
                }}>
                    {symbol}
                </div>
            </div>

            {/* floating + signs */}
            {FLOAT_DELAYS.map((delay, i) => (
                <div key={i} style={{
                    position: "absolute", bottom: 14, left: FLOAT_LEFTS[i],
                    fontSize: 14, fontWeight: 900, color: "rgba(251,191,36,.85)",
                    animation: `tx_floatPlus 2s ${delay} ease-out infinite`
                }}>
                    +
                </div>
            ))}

            <p style={{
                position: "absolute", bottom: 5, left: 0, right: 0,
                textAlign: "center", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", color: "rgba(252,211,77,.7)", textTransform: "uppercase"
            }}>
                Earned
            </p>
        </div>
    );
}

const PENALTY_MINUS_DELAYS = ["0s", ".55s", "1.1s", "1.65s"];
const PENALTY_MINUS_LEFTS  = ["36%", "44%", "54%", "62%"];

function PenaltyScene() {
    return (
        <div style={{
            position: "relative", height: "100%", overflow: "hidden",
            background: "radial-gradient(ellipse 80% 70% at 50% 50%,rgba(239,68,68,.3) 0%,rgba(127,29,29,.14) 45%,rgba(15,23,42,0) 70%),#0f172a",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "radial-gradient(circle,rgba(239,68,68,.18) 0%,rgba(239,68,68,.04) 100%)",
                border: "2px solid rgba(239,68,68,.65)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, animation: "tx_penaltyPulse 1.8s ease-in-out infinite"
            }}>⚠️</div>
            {PENALTY_MINUS_DELAYS.map((delay, i) => (
                <div key={i} style={{
                    position: "absolute", bottom: 18, left: PENALTY_MINUS_LEFTS[i],
                    fontSize: 16, fontWeight: 900, color: "rgba(251,113,133,.85)",
                    animation: `tx_penaltyMinus 2s ${delay} ease-out infinite`
                }}>−</div>
            ))}
            <p style={{
                position: "absolute", bottom: 5, left: 0, right: 0, textAlign: "center", fontSize: 11,
                fontWeight: 700, letterSpacing: "0.15em", color: "rgba(251,113,133,.7)", textTransform: "uppercase"
            }}>Penalized</p>
        </div>
    );
}

const CHARGE_PCT_DELAYS = ["0s", ".55s", "1.1s", "1.65s"];
const CHARGE_PCT_LEFTS  = ["36%", "44%", "54%", "62%"];

function ChargeScene() {
    return (
        <div style={{
            position: "relative", height: "100%", overflow: "hidden",
            background: "radial-gradient(ellipse 80% 70% at 50% 50%,rgba(249,115,22,.25) 0%,rgba(124,45,18,.1) 45%,rgba(15,23,42,0) 70%),#0f172a",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "radial-gradient(circle,rgba(249,115,22,.18) 0%,rgba(249,115,22,.04) 100%)",
                border: "2px solid rgba(249,115,22,.65)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 900, color: "rgba(253,186,116,.95)",
                animation: "tx_chargePulse 1.8s ease-in-out infinite"
            }}>%</div>
            {CHARGE_PCT_DELAYS.map((delay, i) => (
                <div key={i} style={{
                    position: "absolute", bottom: 18, left: CHARGE_PCT_LEFTS[i],
                    fontSize: 14, fontWeight: 900, color: "rgba(253,186,116,.8)",
                    animation: `tx_chargePct 2s ${delay} ease-out infinite`
                }}>%</div>
            ))}
            <p style={{
                position: "absolute", bottom: 5, left: 0, right: 0, textAlign: "center", fontSize: 11,
                fontWeight: 700, letterSpacing: "0.15em", color: "rgba(253,186,116,.7)", textTransform: "uppercase"
            }}>Charged</p>
        </div>
    );
}

/* ─── scene chooser ─── */
function TransactionScene({ type, currency }: { type: TransactionInterface["type"]; currency: string }) {
    const cc = getCurrencyConfig(currency);
    const sym = cc.symbol;
    switch (type) {
        case "deposit": return <DepositScene symbol={sym} />;
        case "withdrawal": return <WithdrawalScene symbol={sym} />;
        case "investment": return <InvestmentScene />;
        case "earning": return <EarningScene symbol={sym} />;
        case "penalty": return <PenaltyScene />;
        case "charge": return <ChargeScene />;
        default: return <DepositScene symbol={sym} />;
    }
}

/* ─── detail row ─── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}

/* ─── modal ─── */
interface Props {
    transaction: TransactionInterface | null;
    onClose: () => void;
}

export default function TransactionDetailModal({ transaction, onClose }: Props) {
    if (!transaction) return null;

    const tc = TYPE_CONFIG[transaction.type];
    const sc = STATUS_CONFIG[transaction.status];
    const umc = USER_MODEL_CONFIG[transaction.userModel] ?? USER_MODEL_CONFIG.Client;
    const cc = getCurrencyConfig(transaction.currency);
    const TypeIcon = tc.icon;
    const UMIcon = umc.icon;
    const CurrencyIcon = CURRENCY_CONFIG[transaction.currency]?.icon;

    const name = getUserName(transaction.userId);
    const email = getUserEmail(transaction.userId);
    const adminName = getAdminName(transaction.createdBy);
    const isInflow = transaction.type === "deposit" || transaction.type === "earning";

    return (
        <>
            {/* inject keyframes once */}
            <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

            {/* backdrop */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[3px]"
                onClick={onClose}
            >
                {/* panel */}
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    style={{ animation: "tx_modalIn .28s cubic-bezier(.34,1.2,.64,1) both" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── 3D animation scene ── */}
                    <div style={{ height: 158, position: "relative" }}>
                        <TransactionScene type={transaction.type} currency={transaction.currency} />

                        {/* floating amount on scene */}
                        <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexDirection: "column", gap: 4,
                            pointerEvents: "none",
                        }}>
                            <div style={{
                                background: "rgba(15,23,42,.55)",
                                backdropFilter: "blur(8px)",
                                borderRadius: 14,
                                padding: "6px 18px",
                                border: "1px solid rgba(255,255,255,.08)",
                            }}>
                                <p style={{
                                    fontSize: 26, fontWeight: 900, lineHeight: 1.1,
                                    color: isInflow ? "#34d399" : "#fb7185",
                                    fontFamily: "var(--font-sans, sans-serif)",
                                    textShadow: `0 0 20px ${isInflow ? "rgba(52,211,153,.6)" : "rgba(251,113,133,.6)"}`,
                                }}>
                                    {isInflow ? "+" : "−"}{formatCurrencyAmount(transaction.amount, transaction.currency)}
                                </p>
                                <span style={{
                                    display: "block", textAlign: "center",
                                    fontSize: 11, fontWeight: 700,
                                    color: "rgba(148,163,184,.85)",
                                    letterSpacing: "0.1em",
                                }}>
                                    {cc.symbol} {cc.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── header ── */}
                    <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.chip.split(" ").slice(0, 2).join(" ")}`}>
                                <TypeIcon size={15} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-bold text-slate-800 leading-tight">{tc.label} Transaction</h3>
                                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">{transaction._id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sc.chip}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                            </span>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* ── currency badge row ── */}
                    <div className={`flex items-center gap-3 px-5 py-2.5 ${isInflow ? "bg-emerald-50/50" : transaction.type === "investment" ? "bg-blue-50/50" : "bg-rose-50/50"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cc.iconBg}`}>
                            {CurrencyIcon
                                ? <CurrencyIcon size={16} className={cc.iconColor} />
                                : <span className={`text-[15px] font-black leading-none ${cc.iconColor}`}>{cc.symbol}</span>
                            }
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${cc.chip}`}>
                                {cc.symbol} {cc.label}
                            </span>
                            <span className="text-[12px] text-slate-500">·</span>
                            <span className={`text-[13px] font-bold ${isInflow ? "text-emerald-700" : "text-rose-700"}`}>
                                {isInflow ? "+" : "−"}{formatCurrencyAmount(transaction.amount, transaction.currency)} {cc.label}
                            </span>
                        </div>
                    </div>

                    {/* ── detail rows ── */}
                    <div className="px-5 py-2">
                        <Row label="User">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                    {getInitials(name)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{email}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1 shrink-0 ${umc.badge}`}>
                                    <UMIcon size={9} />
                                    {umc.label}
                                </span>
                            </div>
                        </Row>

                        {transaction.description && (
                            <Row label="Description">
                                <p className="text-[12px] text-slate-700 leading-relaxed">{transaction.description}</p>
                            </Row>
                        )}

                        {transaction.referenceId && (
                            <Row label="Reference">
                                <div className="flex items-center gap-1.5">
                                    <Hash size={11} className="text-slate-400" />
                                    <span className="text-[11px] font-mono text-slate-600 break-all">{String(transaction.referenceId)}</span>
                                </div>
                            </Row>
                        )}

                        <Row label="Processed by">
                            <div className="flex items-center gap-1.5">
                                <UserIcon size={11} className="text-slate-400" />
                                <span className="text-[12px] text-slate-700">{adminName}</span>
                            </div>
                        </Row>

                        <Row label="Created">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={11} className="text-slate-400" />
                                <span className="text-[12px] text-slate-700">{formatDateTime(transaction.createdAt)}</span>
                            </div>
                        </Row>

                        {transaction.updatedAt !== transaction.createdAt && (
                            <Row label="Updated">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={11} className="text-slate-400" />
                                    <span className="text-[12px] text-slate-700">{formatDateTime(transaction.updatedAt)}</span>
                                </div>
                            </Row>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
