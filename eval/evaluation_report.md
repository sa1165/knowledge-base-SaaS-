# Hybrid RAG Pipeline Evaluation Report

## Benchmark Summary

- **Total Test Queries**: 10
- **Hybrid Search Engine**: Vector Cosine Distance + BM25 Full-Text Search (RRF $k=60$)
- **Mean Precision@3**: **40.0%**
- **Mean Recall@3**: **100.0%**
- **Average Faithfulness Score**: **5.00 / 5.00**

## Detailed Test Case Results

| Query ID | Test Query | Top Retrieved Document | RRF Score | Precision@3 | Recall@3 | Faithfulness (1-5) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `eval-1` | How do I initialize my workspace domain and generate API keys? | `quickstart-guide.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-2` | What HTTP header must be passed for API authentication? | `api-auth-spec.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-3` | What happens when rate limits are exceeded? | `api-auth-spec.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-4` | What are the SAML ACS URL and Entity ID for Okta SSO? | `saml-sso-guide.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-5` | How are mid-cycle user seats billed? | `billing-policy.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-6` | How do I verify webhook payloads from NovaBase? | `webhooks-guide.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-7` | How do I resolve CORS origin blocked errors? | `cors-troubleshooting.txt` | 0.0328 | 0.33 | 1 | 5/5 |
| `eval-8` | What role permissions are available for workspace members? | `quickstart-guide.txt` | 0.0328 | 0.67 | 1 | 5/5 |
| `eval-9` | What is the Pro plan request rate limit? | `api-auth-spec.txt` | 0.0328 | 0.67 | 1 | 5/5 |
| `eval-10` | Where can past invoice PDFs be downloaded? | `billing-policy.txt` | 0.0328 | 0.33 | 1 | 5/5 |
