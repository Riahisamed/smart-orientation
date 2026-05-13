# Smart Orientation - PDF & Recommendation Quality Fix

## Plan (approved)
1. Update PDF generator in `smart-orientation-backend/src/reports/reports.service.ts`.
2. Fix domain filtering for PDF (top 1/2 dominant domains only).
3. Remove any display of `Domaine: General`.
4. Make roadmap bullets domain-specific (no generic “commencer par les bases…” template).
5. Group careers per domain with bullet layout + spacing.
6. Improve visual readability (section separation, no mixed paragraphs).
7. Add/format a concise AI summary line (profile-consistent).

## Progress
- [x] Implement code changes in reports.service.ts

- [ ] Run backend build/tests
- [ ] Verify PDF output for a sample student (e.g., Bac MATH)

