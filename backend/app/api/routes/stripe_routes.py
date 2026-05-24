"""Stripe billing routes: checkout session, webhook, customer portal."""
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware.auth import require_user
from app.services.supabase_client import get_supabase

router = APIRouter()

stripe.api_key = settings.stripe_secret_key


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_create_customer(user_id: str, email: str) -> str:
    """Return existing Stripe customer ID or create one."""
    sb = get_supabase()
    row = (
        sb.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if row.data and row.data.get("stripe_customer_id"):
        return row.data["stripe_customer_id"]

    customer = stripe.Customer.create(email=email, metadata={"supabase_user_id": user_id})
    sb.table("subscriptions").upsert(
        {"user_id": user_id, "stripe_customer_id": customer.id, "plan": "free"}
    ).execute()
    return customer.id


# ── Checkout session ───────────────────────────────────────────────────────────

@router.post("/stripe/create-checkout-session")
async def create_checkout_session(user=Depends(require_user)):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe non configurato.")

    customer_id = _get_or_create_customer(str(user.id), user.email or "")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.frontend_url}/dashboard?upgraded=true",
        cancel_url=f"{settings.frontend_url}/pricing?canceled=true",
        metadata={"supabase_user_id": str(user.id)},
    )
    return {"url": session.url}


# ── Customer portal ────────────────────────────────────────────────────────────

@router.post("/stripe/portal")
async def customer_portal(user=Depends(require_user)):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe non configurato.")

    sb = get_supabase()
    row = (
        sb.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )
    if not row.data or not row.data.get("stripe_customer_id"):
        raise HTTPException(status_code=404, detail="Nessun abbonamento attivo.")

    portal = stripe.billing_portal.Session.create(
        customer=row.data["stripe_customer_id"],
        return_url=f"{settings.frontend_url}/dashboard",
    )
    return {"url": portal.url}


# ── Webhook ────────────────────────────────────────────────────────────────────

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature.")

    sb = get_supabase()

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("supabase_user_id")
        sub_id = session.get("subscription")
        if user_id and sub_id:
            sb.table("subscriptions").upsert(
                {"user_id": user_id, "stripe_subscription_id": sub_id, "plan": "pro", "status": "active"}
            ).execute()

    elif event["type"] in ("customer.subscription.updated", "customer.subscription.deleted"):
        sub = event["data"]["object"]
        customer_id = sub.get("customer")
        row = (
            sb.table("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customer_id)
            .maybe_single()
            .execute()
        )
        if row.data:
            plan = "pro" if sub.get("status") == "active" else "free"
            sb.table("subscriptions").update(
                {"plan": plan, "status": sub.get("status", "canceled")}
            ).eq("user_id", row.data["user_id"]).execute()

    return JSONResponse({"received": True})
