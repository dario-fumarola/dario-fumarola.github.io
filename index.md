---
layout: default
title: Dario Fumarola
description: >-
  Dario Fumarola is an AI researcher and Forward Deployed Engineer at AWS in New York,
  working on reinforcement learning, LLM agents and adaptive inference.
last_modified_at: 2026-10-16
---

<section class="page-section" aria-labelledby="about">
<h2 id="about">About Me</h2>
<div class="about-copy">
<p>With AWS customers, I take a working experiment through deployment. Latency, integration and reliability matter as much as model quality, and I stay involved as the system goes into use.</p>
<p>At Amazon Science, I work on reinforcement learning and adaptive inference. I study how agents reason and cooperate, and how their behavior holds up when conditions change after training.</p>
</div>
<p class="about-note">For research or engineering collaborations, <a href="mailto:hello@dariofumarola.com">get in touch</a>.</p>
</section>

<section class="page-section" id="work" aria-labelledby="presented-work">
<div class="section-heading">
<h2 id="presented-work">Selected Work</h2>

</div>

<div class="work-grid">

<div class="project-card" data-category="conference">
{% include motion/project-mark.html kind="mood" %}
<h3><a href="./projects/mood-swings.html">Mood Swings: Calibrated Reward-Cost Control</a> <span class="venue-badge icml">ICML 2025</span></h3>
<p>Make a trained agent more or less cautious at deployment, without retraining.</p>
<p class="project-result">98% of an eight-policy library's reward-cost coverage, at one-eighth the training.</p>
<div class="card-links">
<a href="./projects/mood-swings.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="https://icml.cc/media/icml-2025/Slides/46772_oP1ogao.pdf" target="_blank" rel="noopener">Paper</a>
</div>
</div>

<div class="project-card" data-category="conference">
{% include motion/project-mark.html kind="memory" %}
<h3><a href="./projects/who-needs-attention-anyway.html">Who Needs Attention Anyway?</a> <span class="venue-badge neurips">NeurIPS 2025</span></h3>
<p>A controller remembers a planner's corrections so the next decision can reuse them.</p>
<p class="project-result">About 23% fewer repeated derivative evaluations over the following eight decisions.</p>
<div class="card-links">
<a href="./projects/who-needs-attention-anyway.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="https://neurips.cc/media/neurips-2025/Slides/128648_FEbZXh8.pdf" target="_blank" rel="noopener">Paper</a>
</div>
</div>

<div class="project-card" data-category="conference">
{% include motion/project-mark.html kind="broadcast" %}
<h3><a href="./projects/broadcast-gain.html">Broadcast-Gain: Coordinating Agents with Small Messages</a> <span class="venue-badge nyrl">NY-RL 2025</span></h3>
<p>Let agents report what they need so a shared controller can coordinate their next moves.</p>
<p class="project-result">Two-byte demand reports guide junction access. A deadline keeps inconclusive reports from postponing a turn.</p>
<div class="card-links">
<a href="./projects/broadcast-gain.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="./assets/broadcast-gain.pdf" target="_blank" rel="noopener">Paper</a>
</div>
</div>

</div>
</section>

<section class="page-section" aria-labelledby="interests">
<h2 id="interests">Research &amp; Engineering Interests</h2>
<div class="interest-grid">
<div>
<h3>Agent training</h3>
<p>Reinforcement learning and model training for agents that reason, use tools and cooperate. I'm interested in what interaction teaches, and what kinds of experience an agent needs.</p>
</div>
<div>
<h3>Memory &amp; computation</h3>
<p>A model can spend more compute on a hard decision or carry a useful correction into the next one. I study how those choices change its behavior after training.</p>
</div>
<div>
<h3>Evaluation &amp; deployment</h3>
<p>Customer work starts with a task someone needs to get done. I build evaluations around that task and follow the system through integration, inference tuning and failure recovery.</p>
</div>
</div>
</section>

<div class="background-grid">
<section class="page-section experience-section" aria-labelledby="experience">
<div class="section-heading">
<h2 id="experience">Experience</h2>
</div>

<div class="xp-item">
<h3>Amazon Web Services</h3>
<p class="xp-org">Forward Deployed Engineer &middot; 2023 to present</p>
<p>Technical lead for more than 20 enterprise AI engagements, from customer discovery through production. For pharmaceutical research teams, I built deployment agents that automate model packaging, GPU scheduling, validation and recovery, cutting deployment time from weeks to hours.</p>
<p>Other work spans evaluation frameworks, Bedrock inference optimization and camera-to-radar data synthesis.</p>
</div>

<div class="xp-item">
<h3>Amazon Science</h3>
<p class="xp-org">AI Researcher &middot; 2023 to present</p>
<p>I co-lead a Build on Trainium project studying whether training LLM agents through social interactions improves cooperation, reasoning and safety. I work on the training infrastructure and evaluation across checkpoints.</p>
</div>

</section>
<section class="page-section education-section" aria-labelledby="education">
<h2 id="education">Education</h2>

<div class="xp-item">
<h3>Washington and Lee University</h3>
<p class="xp-org">Bachelor's degree in Computer Science and Mathematics &middot; 2019–2023</p>
<p>Undergraduate research on numerical methods for nonlinear differential equations.</p>
</div>

</section>
</div>
<p class="header-updated">Last updated: October 2026</p>
