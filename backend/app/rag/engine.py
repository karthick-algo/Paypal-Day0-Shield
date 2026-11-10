"""Retrieval-Augmented Generation (RAG) Engine for PayPal Seller Protection & Disaster Policies."""

import re
import math
from typing import List, Dict, Any, Optional
from app.rag.corpus import POLICIES

class RAGEngine:
    """Lightweight, deterministic vector & semantic retrieval engine for PayPal policy corpus."""

    def __init__(self, corpus: Optional[List[Dict[str, Any]]] = None):
        self.corpus = corpus or POLICIES
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        """Normalize and tokenize text into words and 2-grams."""
        words = re.findall(r"\b[a-zA-Z0-9_\-]{2,}\b", text.lower())
        # Add bigrams for compound phrases like "seller protection", "item not received"
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words) - 1)]
        return words + bigrams

    def _build_index(self):
        """Construct TF-IDF term index across the knowledge corpus."""
        self.doc_tokens = []
        self.doc_word_counts = []
        self.vocab = set()

        for doc in self.corpus:
            combined_text = f"{doc['title']} {' '.join(doc['tags'])} {doc['content']} {doc.get('admissibility_standard', '')}"
            tokens = self._tokenize(combined_text)
            self.doc_tokens.append(tokens)
            
            counts = {}
            for t in tokens:
                counts[t] = counts.get(t, 0) + 1
            self.doc_word_counts.append(counts)
            self.vocab.update(counts.keys())

        # Document frequencies for IDF
        num_docs = len(self.corpus)
        self.idf = {}
        for term in self.vocab:
            df = sum(1 for counts in self.doc_word_counts if term in counts)
            self.idf[term] = math.log((num_docs + 1) / (df + 1)) + 1.0

        # Precompute TF-IDF document vectors and magnitudes
        self.doc_vectors = []
        self.doc_magnitudes = []
        for counts in self.doc_word_counts:
            vec = {}
            mag_sq = 0.0
            for term, count in counts.items():
                tfidf = count * self.idf.get(term, 1.0)
                vec[term] = tfidf
                mag_sq += tfidf * tfidf
            self.doc_vectors.append(vec)
            self.doc_magnitudes.append(math.sqrt(mag_sq) if mag_sq > 0 else 1.0)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve top_k most relevant policy sections for a query."""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        q_counts = {}
        for t in query_tokens:
            q_counts[t] = q_counts.get(t, 0) + 1

        q_vec = {}
        q_mag_sq = 0.0
        for term, count in q_counts.items():
            if term in self.idf:
                val = count * self.idf[term]
                q_vec[term] = val
                q_mag_sq += val * val

        q_mag = math.sqrt(q_mag_sq) if q_mag_sq > 0 else 1.0

        scored_results = []
        for i, doc in enumerate(self.corpus):
            doc_vec = self.doc_vectors[i]
            dot_product = sum(weight * doc_vec.get(term, 0.0) for term, weight in q_vec.items())
            cosine_sim = dot_product / (q_mag * self.doc_magnitudes[i]) if (q_mag * self.doc_magnitudes[i]) > 0 else 0.0

            # Boost if query matches tags exactly
            tag_matches = sum(1 for tag in doc.get("tags", []) if tag in query.lower())
            final_score = cosine_sim + (tag_matches * 0.15)

            if final_score > 0.05:
                scored_results.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "score": round(final_score, 4),
                    "content": doc["content"],
                    "source": doc["source"],
                    "tags": doc.get("tags", []),
                    "admissibility_standard": doc.get("admissibility_standard", ""),
                })

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]

    def generate_defense_brief(self, entity_id: int, entity_type: str, hazard_type: str, region: str) -> Dict[str, Any]:
        """Synthesize a policy-grounded dispute defense proposal using retrieved context."""
        query = f"dispute seller protection item not received force majeure {hazard_type} {region} carrier delay evidence"
        citations = self.retrieve(query, top_k=2)

        primary_policy = citations[0] if citations else None
        secondary_policy = citations[1] if len(citations) > 1 else None

        policy_id = primary_policy["id"] if primary_policy else "PAYPAL-SP-001"
        policy_title = primary_policy["title"] if primary_policy else "PayPal Seller Protection"

        brief_text = (
            f"EVIDENTIARY DEFENSE BRIEF FOR {entity_type.upper()} #{entity_id}:\n"
            f"1. Factual Premise: Dispatch affected by declared {hazard_type} emergency in the {region} logistics corridor.\n"
            f"2. Applicable Policy: Governed by {policy_id} ({policy_title}).\n"
            f"3. Compliance Standard: Carrier transit SLA suspension invoked under contractual force majeure.\n"
            f"4. Recommended Action: Submit certified carrier tracking telemetry with Open-Meteo meteorological report.\n"
            f"5. Statutory Defense: Satisfies objective impossibility criteria, averting automatic dispute debit."
        )

        return {
            "entity_id": entity_id,
            "entity_type": entity_type,
            "hazard_type": hazard_type,
            "region": region,
            "defense_brief": brief_text,
            "citations": citations,
            "primary_policy_id": policy_id,
            "admissible": True,
        }

    def add_document(
        self,
        title: str,
        content: str,
        category: str = "Merchant Ingestion",
        tags: Optional[List[str]] = None,
        source: str = "Merchant Ingestion",
        admissibility_standard: str = "Merchant Uploaded Policy Reference",
    ) -> Dict[str, Any]:
        """Ingest a new policy document or external reference into the runtime RAG index."""
        doc_id = f"PAYPAL-CUSTOM-{len(self.corpus) + 1:03d}"
        inferred_tags = tags or [t.lower() for t in re.findall(r"\b[a-zA-Z]{4,}\b", f"{title} {content[:100]}")[:6]]
        doc = {
            "id": doc_id,
            "title": title.strip(),
            "category": category.strip(),
            "tags": inferred_tags,
            "content": content.strip(),
            "source": source.strip(),
            "admissibility_standard": admissibility_standard.strip(),
        }
        self.corpus.append(doc)
        self._build_index()
        return doc

# Global singleton
rag_engine = RAGEngine()
