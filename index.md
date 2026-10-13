---
layout: default
title: Dario Fumarola
description: >-
  Dario Fumarola is an AI researcher and Prototyping Architect at Amazon Web Services in New York City,
  working on reinforcement learning, geometric representation learning, LLM agents, and large-scale vector search.
---

<section class="page-section" aria-labelledby="about">
<h2 id="about">About Me</h2>
<div class="about-copy" markdown="1">

My research focuses on reinforcement learning, representation learning, and the geometry of neural systems. I'm especially interested in how graph structure and differential geometry can shape more robust, interpretable representations, and how RL agents can adapt their behavior and computation under uncertainty. Lately, I've been focusing on adaptive control mechanisms and multi-agent settings, with an emphasis on stability, long-tail performance, and clear behavioral knobs.

I'm actively seeking research collaborations to apply these directions to real-world problems in learning and decision-making — feel free to [reach out](mailto:dariofumarola90@gmail.com) if you'd like to discuss ideas or build something together :)

</div>
</section>

<section class="page-section" aria-labelledby="research-interests">
<h2 id="research-interests">Research Interests</h2>

<div class="interest-grid">
<div class="interest-card">
<h3>RL &amp; Adaptive Control</h3>
<p>How agents allocate computation and risk under uncertainty — stable learning, long-horizon credit assignment, and interpretable control signals.</p>
</div>
<div class="interest-card">
<h3>Geometric Representation Learning</h3>
<p>Geometric and graph-based perspectives for understanding and shaping neural representations — invariances, robustness, and explanations that map to meaningful structure.</p>
</div>
<div class="interest-card">
<h3>Scalable Retrieval Systems</h3>
<p>Billion-scale embedding systems and cloud-native ML — efficient indexing and storage, resource-aware inference, and distributed pipelines with predictable quality at scale.</p>
</div>
</div>

</section>

<section class="page-section" aria-labelledby="presented-work">
<div class="section-heading">
<h2 id="presented-work">Presented Work</h2>

</div>

<div class="work-grid">

<div class="project-card" data-category="conference">
<h3><a href="./projects/mood-swings.html">Mood Swings: Neuromodulatory Control for Deep RL Agents</a> <span class="venue-badge icml">ICML 2025</span></h3>
<p>Mood Swings introduces a compact control interface for actor–critic agents using three global scalars: dopaminergic gain on TD error and two serotonergic coefficients controlling entropy drive and threat discounting. These scalars define a continuous "mood" manifold outside the network, enabling behavior shifts by writing three floats rather than retraining. Experiments in Pac-Mind and MiniHack trace smooth safety–performance frontiers, with higher dopamine accelerating learning but increasing collision risk, and higher serotonin improving survival while moderating returns.</p>
<div class="card-links">
<a href="./projects/mood-swings.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="https://icml.cc/media/icml-2025/Slides/46772_lAk9vrp.pdf" target="_blank" rel="noopener">Paper (PDF)</a>
</div>
</div>

<div class="project-card" data-category="conference">
<h3><a href="./projects/elastic-state-models.html">Elastic State Models: Geometry-Aware Adaptive Compute</a> <span class="venue-badge neurips">NeurIPS 2025</span></h3>
<p>Elastic State Models (ESM) add adaptive computation to a streaming state-space backbone by converting per-step error into an integer refinement depth under an explicit compute penalty. When activated, ESM performs latent-space updates using metric-preconditioned gradients with trust-region clipping to stabilize correction. The method concentrates compute on difficult timesteps, improving performance in maze navigation and protein loop repair while using lower average compute than Transformer baselines.</p>
<div class="card-links">
<a href="./projects/elastic-state-models.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="https://neurips.cc/media/neurips-2025/Slides/128648_6MphO7a.pdf" target="_blank" rel="noopener">Paper (PDF)</a>
</div>
</div>

<div class="project-card" data-category="conference">
<h3><a href="./projects/broadcast-gain.html">Broadcast-Gain: Minimal Control Plane for Cooperative MARL</a> <span class="venue-badge nyrl">NY-RL 2025</span></h3>
<p>Broadcast-Gain (BG) is a fixed-rate, neighbor-only overlay that improves coordination in cooperative MARL under lossy communication. Each agent broadcasts two bytes per cycle (a signed residual and a meta tag) without modifying the base PPO+GAE learner; receivers compute a confidence-weighted consensus that gates a phase scheduler and applies a clipped, distance-decayed bias to the MOVE logit near junctions. At ~0.24 kbit/s per agent, BG reduces tail wait by ~5 steps and increases near-gate flow by +392 per 1k steps on hard evaluation cells.</p>
<div class="card-links">
<a href="./projects/broadcast-gain.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="./assets/nyrl-poster.pdf">Poster (PDF)</a>
</div>
</div>

</div>
</section>

<div class="background-grid">
<section class="page-section experience-section" aria-labelledby="experience">
<h2 id="experience">Experience</h2>

<div class="xp-item">
<h3>Amazon Web Services — Prototyping</h3>
<p class="xp-org">Prototyping Architect &middot; New York City</p>
<p>Delivered customer-facing AI solutions on AWS, including multimodal and agent-based workflows, from data ingestion through model inference and evaluation. Built with infrastructure-as-code, automated testing, and clear monitoring so results were repeatable and reliable, and the work supported multi-million-dollar sales outcomes.</p>
</div>

<div class="xp-item">
<h3>Amazon Science — Research</h3>
<p class="xp-org">Independent Research Agenda</p>
<p>Conducted research with increasing independence, developing and executing a personal research agenda alongside core embedding/indexing work. Presented research outcomes externally, including demos and technical discussions at Amazon's conference booth, and collaborated with researchers on experimental design, writing, and invention work across embedding systems and learning-driven mechanisms.</p>
</div>

</section>
<section class="page-section education-section" aria-labelledby="education">
<h2 id="education">Education</h2>

<div class="xp-item">
<h3>Washington and Lee University</h3>
<p class="xp-org">B.S. Computer Science and Mathematics &middot; 2019–2023 &middot; <em>Davis Scholar</em></p>
<p>Relevant coursework: Deep Learning, Machine Learning and Big Data, Real Analysis, Network Security, Differential Geometry, Differential Equations.</p>
</div>

<h3>Professional Memberships</h3>

<ul class="memberships">
<li>IEEE</li>
<li>ACM</li>
<li>AAAI</li>
</ul>

</section>
</div>
<p class="header-updated">Last updated: January 2026</p>
