import fitz  # PyMuPDF
import anthropic

from app.config import settings
from app.models.dora_report import DoraClause, DoraReport

_TOOL_SCHEMA = {
    "name": "dora_compliance_report",
    "description": "Output strutturato per l'analisi di conformità DORA Art. 30",
    "input_schema": {
        "type": "object",
        "properties": {
            "punteggio_conformita": {
                "type": "integer",
                "description": "Punteggio 0-100 di conformità complessiva all'Art. 30 DORA",
            },
            "sommario": {
                "type": "string",
                "description": "Sommario esecutivo (max 3 frasi) della conformità del contratto",
            },
            "clausole": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "nome": {"type": "string"},
                        "riferimento_normativo": {"type": "string"},
                        "status": {
                            "type": "string",
                            "enum": ["presente", "mancante", "incompleta"],
                        },
                        "estratto": {
                            "type": "string",
                            "description": "Estratto testuale rilevante dal contratto (se trovato)",
                        },
                        "note": {
                            "type": "string",
                            "description": "Spiegazione del giudizio",
                        },
                    },
                    "required": ["nome", "riferimento_normativo", "status", "note"],
                },
            },
            "raccomandazioni": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Azioni concrete da richiedere al fornitore",
            },
        },
        "required": ["punteggio_conformita", "sommario", "clausole", "raccomandazioni"],
    },
}

_SYSTEM_PROMPT = """Sei un esperto legale specializzato nel Digital Operational Resilience Act (DORA),
Regolamento UE 2022/2554. Il tuo compito è analizzare contratti con fornitori ICT e verificare
la conformità all'Articolo 30 del regolamento.

Analizza il contratto per le 8 clausole obbligatorie dell'Art. 30:
1. Descrizione completa dei servizi ICT [Art. 30(2)(a)]
2. Localizzazione di dati, sistemi e processi [Art. 30(2)(b)]
3. Livelli di servizio (SLA) e obiettivi di performance [Art. 30(2)(c)]
4. Sicurezza dei dati e misure di protezione [Art. 30(2)(d)]
5. Diritti di accesso, ispezione e audit del cliente e delle autorità [Art. 30(2)(e)]
6. Gestione e notifica degli incidenti ICT [Art. 30(2)(f)]
7. Continuità operativa e piani di ripristino [Art. 30(2)(g)]
8. Exit strategy, portabilità dei dati e supporto alla transizione [Art. 30(2)(h)]

Per ogni clausola:
- PRESENTE: chiaramente definita e sufficientemente dettagliata
- INCOMPLETA: presente ma vaga, senza metriche o scadenze specifiche
- MANCANTE: assente nel contratto

Il punteggio di conformità si calcola: (PRESENTE × 12.5) + (INCOMPLETA × 6.25) su 100.
Usa SEMPRE il tool dora_compliance_report per l'output."""

_DEMO_CONTRACT = """CLOUD SERVICES AGREEMENT - Enterprise Edition

1. SERVICE DESCRIPTION
Provider shall supply cloud computing infrastructure including compute, storage, and networking
services as described in the applicable Order Form.

2. SERVICE LEVELS
Provider targets 99.9% monthly uptime excluding scheduled maintenance windows.
Credits may apply for verified downtime exceeding the target.

3. DATA SECURITY
Provider implements industry-standard security measures including encryption at rest (AES-256)
and in transit (TLS 1.2+). Security certifications: SOC 2 Type II, ISO 27001.

4. DATA LOCATION
Customer data is processed within the European Economic Area unless Customer selects
a non-EEA region. Subprocessors are listed at provider.example.com/subprocessors.

5. TERM AND TERMINATION
Either party may terminate with 90 days written notice. Upon termination, Customer may
export data for 30 days. Provider will delete Customer data within 60 days post-termination.

6. LIMITATION OF LIABILITY
Provider's aggregate liability shall not exceed the fees paid in the prior 12 months.
"""


def _extract_text(pdf_bytes: bytes) -> tuple[str, int]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = len(doc)
    text = "\n\n".join(page.get_text() for page in doc)
    doc.close()
    # Truncate to ~100k chars to stay within Claude context limits
    return text[:100_000], pages


async def analyze_contract(pdf_bytes: bytes | None, demo: bool = False) -> DoraReport:
    if demo:
        contract_text = _DEMO_CONTRACT
        pages = 1
    else:
        assert pdf_bytes is not None
        contract_text, pages = _extract_text(pdf_bytes)

    # AsyncAnthropic: non-blocking, correct for async FastAPI routes
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=_SYSTEM_PROMPT,
        tools=[_TOOL_SCHEMA],
        tool_choice={"type": "tool", "name": "dora_compliance_report"},
        messages=[
            {
                "role": "user",
                "content": f"Analizza il seguente contratto ICT per conformità DORA Art. 30:\n\n{contract_text}",
            }
        ],
    )

    # next(..., None) avoids StopIteration inside async def (PEP 479 converts it to RuntimeError)
    tool_block = next(
        (b for b in response.content if b.type == "tool_use"), None
    )
    if tool_block is None:
        raise ValueError(
            f"Claude non ha restituito un tool_use block. "
            f"stop_reason={response.stop_reason!r}, "
            f"content_types={[b.type for b in response.content]}"
        )

    data = tool_block.input
    clausole = [DoraClause(**c) for c in data["clausole"]]

    return DoraReport(
        punteggio_conformita=data["punteggio_conformita"],
        sommario=data["sommario"],
        clausole=clausole,
        raccomandazioni=data["raccomandazioni"],
        pagine_analizzate=pages,
        caratteri_analizzati=len(contract_text),
    )
