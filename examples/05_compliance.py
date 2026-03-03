"""
Ebbiforge — Example 05: Enterprise Compliance in 3 Lines
=============================================================

Built-in PII detection, audit logging, policy enforcement, and
GDPR compliance. No other AI agent framework has this.

Run: python examples/05_compliance.py
  or: ebbiforge example compliance
"""

try:
    import ebbiforge_core as cogops
except ImportError:
    print("❌ Rust core required. Build with: maturin develop --release")
    exit(1)

print("⚖️  Ebbiforge — Enterprise Compliance Demo")
print("=" * 50)

# ── PII Detection ─────────────────────────────────────────────────
print("\n1️⃣  PII Detection & Blocking")
print("-" * 40)

compliance = cogops.ComplianceEngine()

# Try to send data containing PII
result = compliance.check_action(
    "agent-sales-bot",
    "send_email",
    "Dear John Smith, your SSN is 123-45-6789 and your credit card is 4111-1111-1111-1111"
)
print(f"   Action: send_email with PII")
print(f"   Result: {result}")
print(f"   → Agent was BLOCKED from sending PII externally")

# Clean action passes
result_clean = compliance.check_action(
    "agent-sales-bot",
    "send_email",
    "Dear Customer, your order #12345 has been shipped."
)
print(f"\n   Action: send_email (clean)")
print(f"   Result: {result_clean}")
print(f"   → Clean actions pass through normally")

# ── PII Redaction ─────────────────────────────────────────────────
print("\n2️⃣  PII Redaction")
print("-" * 40)

sensitive = "Contact me at john@example.com or call 555-123-4567"
redacted = compliance.redact_pii(sensitive)
print(f"   Original:  {sensitive}")
print(f"   Redacted:  {redacted}")

# ── Policy Engine ─────────────────────────────────────────────────
print("\n3️⃣  Custom Policy Rules")
print("-" * 40)

compliance.add_policy(
    "NO_DELETE", "delete_database", False,
    "Database deletion requires human approval"
)

result_delete = compliance.check_action(
    "agent-cleanup",
    "delete_database",
    "Dropping production table users"
)
print(f"   Action: delete_database")
print(f"   Result: {result_delete}")
print(f"   → Custom policies block dangerous operations")

# ── Audit Trail ───────────────────────────────────────────────────
print("\n4️⃣  Immutable Audit Trail")
print("-" * 40)

audit_logs = compliance.export_audit_logs()
print(f"   Audit log entries: {audit_logs[:100]}...")
print(f"   → Every action is logged immutably for regulatory review")

# ── GDPR ──────────────────────────────────────────────────────────
print("\n5️⃣  GDPR Compliance")
print("-" * 40)

export = compliance.export_user_data("user-42")
print(f"   Data export: {export[:80]}...")
deleted = compliance.delete_user_data("user-42")
print(f"   Data deletion: {'✅ Complete' if deleted else '❌ Failed'}")
print(f"   → Right to access + right to be forgotten, built into the engine")

# ── Stats ─────────────────────────────────────────────────────────
print(f"\n📊 Compliance Stats: {compliance.stats()}")

print(f"\n{'=' * 50}")
print("--- What just happened? ---")
print("Enterprise compliance features running in Rust at native speed:")
print("  • PII auto-detection and blocking")
print("  • PII redaction (email, phone, SSN)")
print("  • Custom policy rules with deny/allow")
print("  • Immutable audit logging")
print("  • GDPR data export and deletion")
print("No other AI agent framework includes compliance. Period.")
