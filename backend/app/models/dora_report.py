from enum import Enum
from pydantic import BaseModel


class ClauseStatus(str, Enum):
    PRESENTE = "presente"
    MANCANTE = "mancante"
    INCOMPLETA = "incompleta"


class DoraClause(BaseModel):
    nome: str
    riferimento_normativo: str
    status: ClauseStatus
    estratto: str | None = None
    note: str


class DoraReport(BaseModel):
    punteggio_conformita: int          # 0-100
    sommario: str
    clausole: list[DoraClause]
    raccomandazioni: list[str]
    pagine_analizzate: int
    caratteri_analizzati: int
