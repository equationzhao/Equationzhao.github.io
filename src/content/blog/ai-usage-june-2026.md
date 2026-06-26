---
title: '六月 AI 使用记录'
pubDate: 2026-06-26
description: '从零散调用到系统化工作流：网页端负责理解和表达，Codex Desktop 负责工程执行，skill 负责复用，automation 负责后台巡检。'
author: 'Eq'
heroImage: 'https://bingw.jasonzeng.dev?index=26'
tags: ["AI"]
---
<link rel="stylesheet" href="/ai-report.css" />
<div class="ai-report">
<section class="hero">
<div class="hero-date reveal">JUNE 2026 NOTE</div>
<h1>
<span class="line reveal reveal-d1">六月</span>
<span class="line reveal reveal-d2">AI 使用记录</span>
<span class="line reveal reveal-d3">从工具到系统</span>
</h1>
<p class="hero-sub reveal reveal-d4">这个月的变化不是 AI 用得更多，<br>而是使用方式开始有了分层和秩序。</p>
<div class="hero-scroll">SCROLL<div class="arrow"></div></div>
</section>
<section class="section">
<div class="section-label reveal">01 — 主力入口</div>
<h2 class="section-headline reveal reveal-d1">全面转向 GPT Pro</h2>
<div class="sub-grid">
<div class="sub-card reveal reveal-d1">
<div class="sub-name"><span class="sub-dot" style="background:var(--ar-mint)"></span>ChatGPT 网页版</div>
<div class="sub-body">6 月开始全面转向 <strong>GPT Pro</strong> 订阅，主力入口变成 ChatGPT 网页版。相比之前的中转和零散模型调用，体验完整很多，尤其是网页端 PRO 模型，能自己理解算法、读文件、跑测试，适合处理需要上下文和表达质量的任务。</div>
<span class="sub-tag live">主力入口</span>
</div>
<div class="sub-card reveal reveal-d2">
<div class="sub-name"><span class="sub-dot" style="background:var(--ar-sky)"></span>Codex</div>
<div class="sub-body">Codex 仍然是工程执行主力，适合落地代码、跑测试、查仓库、改流程。它没有网页端那么会聊天，但更像一个能稳定动手的工程伙伴。</div>
<span class="sub-tag free">工程执行</span>
</div>
<div class="sub-card reveal reveal-d3">
<div class="sub-name"><span class="sub-dot" style="background:var(--ar-violet)"></span>API 中转</div>
<div class="sub-body">之前那种中转站加零散模型调用的模式，开始退到补充位置。它适合偶发尝试，但不适合作为长期工作流的主入口。</div>
<span class="sub-tag dead">退居补充</span>
</div>
<div class="sub-card reveal reveal-d3">
<div class="sub-name"><span class="sub-dot" style="background:var(--ar-rose)"></span>文件理解</div>
<div class="sub-body">网页端 PRO 模型最明显的提升，是能围绕文件自己建立上下文：读懂算法、提出测试方式、再把结果讲明白。</div>
<span class="sub-tag live">完整体验</span>
</div>
<div class="sub-card reveal reveal-d4">
<div class="sub-name"><span class="sub-dot" style="background:var(--ar-amber)"></span>体验差异</div>
<div class="sub-body">日常对话里，网页端明显更有“活人味儿”；工程任务里，Codex 的优势是可追踪、可操作、可验证。两者不是替代关系，而是开始自然分工。</div>
<span class="sub-tag live">能力分层</span>
</div>
</div>
</section>
<section class="section">
<div class="section-label reveal">02 — 工程工作台</div>
<h2 class="section-headline reveal reveal-d1">从 CLI 转向 Desktop</h2>
<div class="exp-grid">
<div class="exp-card reveal reveal-d1" data-glow="cursor">
<div class="exp-num">01</div>
<div class="exp-head"><div class="exp-icon cursor">D</div><div class="exp-title">Codex Desktop</div></div>
<div class="exp-body">工具上逐渐从 Codex CLI 转向 <span class="hl">Codex Desktop</span>。主要原因很现实：worktree 创建、线程管理、历史 session 回看、跨任务切换，都比 CLI 更适合长期工程工作。</div>
<div class="exp-verdict v-green">长期工作台</div>
</div>
<div class="exp-card reveal reveal-d2" data-glow="ds">
<div class="exp-num">02</div>
<div class="exp-head"><div class="exp-icon ds">C</div><div class="exp-title">Codex CLI</div></div>
<div class="exp-body">CLI 还是好用，但它更像一次性的命令工具：进来、执行、退出。对于临时修一个点很方便，但当任务需要多线程并行、阶段性回看、跨仓库切换时，心智负担会逐渐变重。</div>
<div class="exp-verdict v-amber">一次性工具</div>
</div>
</div>
</section>
<section class="section">
<div class="section-label reveal">03 — 后台巡检</div>
<h2 class="section-headline reveal reveal-d1">AI 开始自己跑起来</h2>
<div class="token-stage">
<div class="token-row reveal reveal-d1">
<div class="token-name" style="color:#34d399">自动补 UT</div>
<div class="token-bar-outer"><div class="token-bar-inner" data-width="92" style="width:0%"><span class="token-bar-label">补覆盖、补边界、补回归</span></div></div>
<div class="token-num">routine</div>
</div>
<div class="token-row reveal reveal-d2">
<div class="token-name" style="color:var(--ar-amber)">优化 AGENTS</div>
<div class="token-bar-outer"><div class="token-bar-inner" data-width="74" style="width:0%"><span class="token-bar-label">把 session 经验沉淀进规则</span></div></div>
<div class="token-num">memory</div>
</div>
<div class="token-row reveal reveal-d3">
<div class="token-name" style="color:var(--ar-sky)">冲突检查</div>
<div class="token-bar-outer"><div class="token-bar-inner" data-width="64" style="width:0%"><span class="token-bar-label">检查 merge conflict 状态</span></div></div>
<div class="token-num">guardrail</div>
</div>
<div class="token-row reveal reveal-d4">
<div class="token-name" style="color:var(--ar-violet)">on-call 监控</div>
<div class="token-bar-outer"><div class="token-bar-inner" data-width="58" style="width:0%"><span class="token-bar-label">低噪声后台观察</span></div></div>
<div class="token-num">signal</div>
</div>
</div>
<div class="token-total reveal reveal-d5">
<div><div class="token-total-label">本月的新变化</div></div>
<div class="token-total-num">主动调用 -> 后台巡检</div>
</div>
<div class="callout reveal reveal-d5">
<div class="callout-head">独立额度</div>
<p>开始使用独立的 <em><code>gpt-5.3-codex-spark</code></em> 模型额度跑定时任务。AI 的一部分使用已经不再是“我想起来了就叫它一下”，而是变成后台持续跑的检查层。</p>
</div>
</section>
<section class="section">
<div class="section-label reveal">04 — 下一步</div>
<h2 class="section-headline reveal reveal-d1">该沉淀流程了</h2>
<div class="exp-grid">
<div class="exp-card reveal reveal-d1" data-glow="gpt">
<div class="exp-num">01</div>
<div class="exp-head"><div class="exp-icon gpt">R</div><div class="exp-title">Root Cause 分析</div></div>
<div class="exp-body">适合把事故、测试失败、线上告警都沉淀成固定分析流程。目标不是写一篇漂亮总结，而是让下一次排查可以少走弯路。</div>
<div class="exp-verdict v-green">可复用分析</div>
</div>
<div class="exp-card reveal reveal-d2" data-glow="cursor">
<div class="exp-num">02</div>
<div class="exp-head"><div class="exp-icon cursor">S</div><div class="exp-title">Session-to-skill</div></div>
<div class="exp-body">每次完成一个复杂 session，都应该问一句：这里有没有可复用的判断、命令、检查清单？如果有，就从聊天记录里提炼成 skill。</div>
<div class="exp-verdict v-amber">经验入库</div>
</div>
<div class="exp-card reveal reveal-d3" data-glow="xiaomi">
<div class="exp-num">03</div>
<div class="exp-head"><div class="exp-icon xiaomi">D</div><div class="exp-title">自动化运行日报</div></div>
<div class="exp-body">自动化已经开始跑起来了，但还缺一个周度或月度汇总层，用来统计哪些自动化真的有价值，哪些只是安静地消耗 token。</div>
<div class="exp-verdict v-fire">价值核算</div>
</div>
<div class="exp-card reveal reveal-d4" data-glow="ds">
<div class="exp-num">04</div>
<div class="exp-head"><div class="exp-icon ds">M</div><div class="exp-title">月度复盘</div></div>
<div class="exp-body">接下来要看的不只是调用量，而是产出：节省了多少人工排查、提前发现多少问题、沉淀了多少可复用流程。</div>
<div class="exp-verdict v-green">从用量到产出</div>
</div>
</div>
</section>
<section class="section">
<div class="callout reveal">
<div class="callout-head">六月结论</div>
<p>整体来看，6 月的变化不是 <em>AI 用得更多</em>，而是 AI 使用方式开始系统化：网页端负责深度理解和表达，Codex Desktop 负责工程执行，skill 负责流程复用，automation 负责后台巡检。</p>
</div>
</section>
<footer class="ar-footer">
<p>JUNE 2026 · EQUATIONZHAO</p>
<div class="accent">下个月看产出</div>
</footer>
</div>
<script src="/ai-report.js"></script>
