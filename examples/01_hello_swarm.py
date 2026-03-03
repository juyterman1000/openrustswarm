"""
Ebbiforge — Example 01: Hello Swarm
=======================================

The simplest multi-agent pipeline. Two agents process a task sequentially,
with full belief provenance tracking.

This is the "Hello World" of Ebbiforge — if you've used LangChain,
this is where you start. But unlike LangChain, every claim is tracked
with source attribution.

Run: python examples/01_hello_swarm.py
  or: ebbiforge example hello
"""

from ebbiforge import Agent, Swarm, Task

# ── Define agents with different roles ────────────────────────────
researcher = Agent(name="Researcher")
researcher.set_output_hook(lambda input_data: {
    "claim": f"Analysis of '{input_data}': The topic shows emerging patterns "
             "across multiple data sources with high correlation.",
    "source": "internal_knowledge",  # No external citation → provenance flags it
    "confidence": 0.7,
})

analyst = Agent(name="Analyst")
analyst.set_output_hook(lambda input_data: {
    "claim": "Based on the research, there are 3 key trends to watch. "
             "However, the upstream data lacks external verification.",
    "source": "derived:Researcher",
    "confidence": 0.85,
})

# ── Build and run the pipeline ────────────────────────────────────
swarm = Swarm()
swarm.add(researcher)
swarm.add(analyst)

result = swarm.run(Task("Analyze emerging AI agent frameworks", pipeline=True))

# ── Show results with provenance ──────────────────────────────────
print("🐝 Ebbiforge — Hello Swarm")
print("=" * 50)
print(f"\nResult: {result}\n")

provenance = swarm.get_belief_provenance(result)
print(f"Provenance Chain: {provenance}")
for record in provenance.records:
    print(f"  {record}")

if provenance.has_unverified:
    print("\n⚠️  WARNING: Pipeline contains unverified claims!")
    print("   In production, these would be flagged for human review.")
else:
    print("\n✅ All claims have external verification.")

print("\n--- What just happened? ---")
print("Two agents processed a task in sequence (pipeline mode).")
print("Each agent's output is tracked with source + confidence.")
print("Unverified claims (sourced from 'internal_knowledge') are flagged.")
print("This is BELIEF PROVENANCE — no other framework does this.")
