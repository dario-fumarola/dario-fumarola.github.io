---
layout: default
title: Dario Fumarola
description: >-
  Dario Fumarola is a Forward Deployed Engineer at Amazon Web Services and ML researcher in New York City,
  working on reinforcement learning, LLM agents, adaptive inference, reasoning, and model training.
---

<section class="page-section" aria-labelledby="about">
<h2 id="about">About Me</h2>
<div class="about-copy">
<p>My research focuses on reinforcement learning for LLM and embodied agents, adaptive computation, and runtime control. I'm interested in how agents can change their behavior safely without retraining, and how evaluation can make those changes easier to understand.</p>
<p>Alongside my engineering work, I conduct research at Amazon Science. I co-lead a Build on Trainium project on safe, social pretraining of LLM agents. I'm open to research collaborations; <a href="mailto:dariofumarola90@gmail.com">get in touch</a> if you'd like to work together.</p>
</div>
</section>

<section class="page-section" aria-labelledby="research-interests">
<h2 id="research-interests">Research Interests</h2>

<div class="interest-grid">
<div class="interest-card">
<h3>RL &amp; Agent Control</h3>
<p>Reinforcement learning for LLM and embodied agents. I'm interested in how agents learn to cooperate and how their behavior changes under new conditions.</p>
</div>
<div class="interest-card">
<h3>Adaptive Inference</h3>
<p>Efficient inference in streaming models. I work on methods that allocate computation to difficult inputs and adapt within a fixed compute budget.</p>
</div>
<div class="interest-card">
<h3>Reasoning &amp; Training</h3>
<p>Reasoning and decision-making in LLMs. I study how reinforcement-learning pretraining changes these abilities, with evaluations that follow models across training checkpoints.</p>
</div>
</div>

</section>

<section class="page-section" aria-labelledby="presented-work">
<div class="section-heading">
<h2 id="presented-work">Presented Work</h2>

</div>

<div class="work-grid">

<div class="project-card" data-category="conference">
<svg class="work-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 8h22M5 16h22M5 24h22"/><circle cx="11" cy="8" r="3"/><circle cx="22" cy="16" r="3"/><circle cx="14" cy="24" r="3"/></svg>
<h3><a href="./projects/mood-swings.html">Mood Swings: Neuromodulatory Control for Deep RL Agents</a> <span class="venue-badge icml">ICML 2025</span></h3>
<p>A runtime control layer for actor-critic agents, using three neuromodulatory scalars to steer reward, exploration, and risk sensitivity without retraining. Maze experiments show how a single policy can move between cautious and reward-seeking behavior.</p>
<div class="card-links">
<a href="./projects/mood-swings.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="https://icml.cc/media/icml-2025/Slides/46772_lAk9vrp.pdf" target="_blank" rel="noopener">Paper (PDF)</a>
</div>
</div>

<div class="project-card" data-category="conference">
<svg class="work-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 4 12 7-12 7-12-7zM4 17l12 7 12-7M4 23l12 7 12-7"/></svg>
<h3><a href="./projects/elastic-state-models.html">Elastic State Models: Geometry-Aware Adaptive Compute</a> <span class="venue-badge neurips">NeurIPS 2025</span></h3>
<p>An inference-time adaptation layer for a frozen streaming state-space model. It allocates extra computation to difficult states within a fixed budget, using geometry-aware updates to improve navigation and protein loop repair without retraining.</p>
<div class="card-links">
<a href="./projects/elastic-state-models.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="https://neurips.cc/media/neurips-2025/Slides/128648_6MphO7a.pdf" target="_blank" rel="noopener">Paper (PDF)</a>
</div>
</div>

<div class="project-card" data-category="conference">
<svg class="work-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="m10 10 12 12M10 22l12-12M16 16v-9M16 16v9"/><circle cx="8" cy="8" r="3"/><circle cx="24" cy="8" r="3"/><circle cx="8" cy="24" r="3"/><circle cx="24" cy="24" r="3"/><circle cx="16" cy="5" r="2"/><circle cx="16" cy="27" r="2"/></svg>
<h3><a href="./projects/broadcast-gain.html">Broadcast-Gain: Minimal Control Plane for Cooperative MARL</a> <span class="venue-badge nyrl">NY-RL 2025</span></h3>
<p>A two-byte broadcast overlay for cooperative reinforcement learning agents. It uses local signals to improve coordination under packet loss, reducing long waits at congested junctions while keeping the underlying PPO learner unchanged.</p>
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
<h3>Amazon Web Services</h3>
<p class="xp-org">Forward Deployed Engineer &middot; June 2023 to present &middot; New York City</p>
<p>I lead enterprise AI projects from discovery through deployment. I've worked on more than 20 engagements and led teams of five or more engineers. Recent work includes agents for pharmaceutical model deployment, evaluation frameworks, Bedrock inference optimization, and camera-to-radar data synthesis.</p>
</div>

<div class="xp-item">
<h3>Amazon Science</h3>
<p class="xp-org">Machine Learning Researcher &middot; 2023 to present</p>
<p>Research on neuromodulated reinforcement learning, adaptive inference, and agent behavior. I also co-lead a Build on Trainium project on safe, social pretraining of LLM agents, including training infrastructure and evaluation across checkpoints.</p>
</div>

</section>
<section class="page-section education-section" aria-labelledby="education">
<h2 id="education">Education</h2>

<div class="xp-item">
<h3>Washington and Lee University</h3>
<p class="xp-org">B.S. Computer Science and Mathematics &middot; 2019–2023 &middot; <em>Davis UWC Scholar</em></p>
<p>Relevant coursework: Deep Learning, Real Analysis, Differential Geometry, Probability, Social Networks.</p>
</div>

<h3>Professional Memberships</h3>

<ul class="memberships">
<li>IEEE</li>
<li>ACM</li>
<li>AAAI</li>
</ul>

</section>
</div>
<p class="header-updated">Last updated: October 2026</p>
