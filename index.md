---
layout: default
---

<h2 id="about">About Me</h2>

<p class="lede">Hey! I'm Dario, a Computer Science and Mathematics graduate from Washington and Lee University. Originally from a <a href="https://en.wikipedia.org/wiki/Cisternino">small village in Italy</a>, I'm currently a Prototyping Architect at Amazon Web Services in New York City, where I build AI systems on AWS and deliver customer-facing solutions designed to work reliably at scale.</p>

My research focuses on reinforcement learning, representation learning, and the geometry of neural systems. I'm especially interested in how graph structure and differential geometry can shape more robust, interpretable representations, and how RL agents can adapt their behavior and computation under uncertainty. Lately, I've been focusing on adaptive control mechanisms and multi-agent settings, with an emphasis on stability, long-tail performance, and clear behavioral knobs.

I'm actively seeking research collaborations to apply these directions to real-world problems in learning and decision-making — feel free to [reach out](mailto:dariofumarola90@gmail.com) if you'd like to discuss ideas or build something together :)

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

<h2 id="presented-work">Presented Work</h2>

<div class="pill-toggle" role="tablist" aria-label="Presented work categories">
  <button class="pill-btn active" role="tab" aria-selected="true" data-tab="conference">Conference</button>
  <button class="pill-btn" role="tab" aria-selected="false" data-tab="research">Research</button>
</div>

<div id="conference" class="projects-section active">

<div class="project-card">
<h3><a href="./projects/mood-swings.html">Mood Swings: Neuromodulatory Control for Deep RL Agents</a> <span class="venue-badge icml">ICML 2025</span></h3>
<p>Mood Swings introduces a compact control interface for actor–critic agents using three global scalars: dopaminergic gain on TD error and two serotonergic coefficients controlling entropy drive and threat discounting. These scalars define a continuous "mood" manifold outside the network, enabling behavior shifts by writing three floats rather than retraining. Experiments in Pac-Mind and MiniHack trace smooth safety–performance frontiers, with higher dopamine accelerating learning but increasing collision risk, and higher serotonin improving survival while moderating returns.</p>
<div class="card-links">
<a href="./projects/mood-swings.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
</div>
</div>

<div class="project-card">
<h3><a href="./projects/elastic-state-models.html">Elastic State Models: Geometry-Aware Adaptive Compute</a> <span class="venue-badge neurips">NeurIPS 2025</span></h3>
<p>Elastic State Models (ESM) add adaptive computation to a streaming state-space backbone by converting per-step error into an integer refinement depth under an explicit compute penalty. When activated, ESM performs latent-space updates using metric-preconditioned gradients with trust-region clipping to stabilize correction. The method concentrates compute on difficult timesteps, improving performance in maze navigation and protein loop repair while using lower average compute than Transformer baselines.</p>
<div class="card-links">
<a href="./projects/elastic-state-models.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="./assets/who-needs-attention-anyway.pdf">Paper (PDF)</a>
</div>
</div>

<div class="project-card">
<h3><a href="./projects/broadcast-gain.html">Broadcast-Gain: Minimal Control Plane for Cooperative MARL</a> <span class="venue-badge nyrl">NY-RL 2025</span></h3>
<p>Broadcast-Gain (BG) is a fixed-rate, neighbor-only overlay that improves coordination in cooperative MARL under lossy communication. Each agent broadcasts two bytes per cycle (a signed residual and a meta tag) without modifying the base PPO+GAE learner; receivers compute a confidence-weighted consensus that gates a phase scheduler and applies a clipped, distance-decayed bias to the MOVE logit near junctions. At ~0.24 kbit/s per agent, BG reduces tail wait by ~5 steps and increases near-gate flow by +392 per 1k steps on hard evaluation cells.</p>
<div class="card-links">
<a href="./projects/broadcast-gain.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
<a href="./assets/nyrl-poster.pdf">Poster (PDF)</a>
</div>
</div>

</div>

<div id="research" class="projects-section">

<div class="project-card">
<h3><a href="./projects/vectors-replication.html">Selective Replication for Efficient k-NN Retrieval</a></h3>
<p>We propose selective vector replication to improve k-nearest neighbor retrieval in clustered high-dimensional indexes. The method identifies boundary vectors likely to be relevant across neighboring clusters and replicates only those vectors into the adjacent partitions they connect. This targeted replication increases recall while reducing the number of vectors scanned per query, yielding better retrieval quality with bounded storage overhead.</p>
<div class="card-links">
<a href="./projects/vectors-replication.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
</div>
</div>

<div class="project-card">
<h3><a href="./projects/s3-index.html">Hierarchically Partitioned Cloud-Native Vector Search</a></h3>
<p>This work adapts graph-based ANN search to object storage by combining hierarchical graph partitioning with parallel S3 reads. Large HNSW graphs are partitioned into size-bounded subgraphs optimized for object fetch and caching behavior, and queries retrieve only the subgraphs required for traversal, in parallel. The result is lower tail latency while maintaining high recall at billion-scale, with predictable storage and compute costs.</p>
<div class="card-links">
<a href="./projects/s3-index.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
</div>
</div>

<div class="project-card">
<h3><a href="./projects/gat-drug-discovery.html">GeoGAT: Geometry-Aware Graph Attention for Molecular Property Prediction</a></h3>
<p>GeoGAT integrates bonded connectivity, 3D geometry, and electronic descriptors in a sparse molecular graph attention model. A global context node captures molecule-level effects while invariant pair and angle features modulate attention to distinguish conformers and long-range interactions. Across tasks such as solubility, LogP, and binding-related prediction, GeoGAT improves accuracy and yields interpretable attention patterns that localize influential atoms and functional groups.</p>
<div class="card-links">
<a href="./projects/gat-drug-discovery.html">Project page <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
</div>
</div>

</div>

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
