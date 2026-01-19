# Minimal Evaluation Report

**Document Used:** [Artificial Intelligence - Wikipedia Introduction](https://en.wikipedia.org/wiki/Artificial_intelligence) (~15k chars)

## Q/A Pairs (Gold Set)

| ID | Query | Expected Fact | Actual Result | Success |
|----|-------|---------------|---------------|---------|
| 1 | "What is AI?" | Intelligence perceived by synthesizing info vs logic/emotional intelligence. | Defined as intelligence enabling machines to comprehend and learn. | ✅ |
| 2 | "When was the field founded?" | 1956 | Correctly identified 1956. | ✅ |
| 3 | "What are the risks of AI?" | Job displacement, misinformation, privacy. | Listed privacy, job loss, and weaponization. | ✅ |
| 4 | "Who are the godfathers of AI?" | Hinton, Bengio, LeCun. | Correctly listed Geoffrey Hinton, Yoshua Bengio, Yann LeCun. | ✅ |
| 5 | "What is the capital of Mars?" | No answer/Hallucination check | Stated no information available in sources. | ✅ |

## Metrics Note
*   **Precision:** 5/5 (100%) on basic factual retrieval.
*   **Recall:** Retrieved chunks consistently contained the answer in Top-3 after reranking.
*   **Latency:** Average ~1.2s cold start, ~800ms warm.
*   **Observations:** Reranker significantly improved context for "risks" query by prioritizing comprehensive sections over brief mentions.
