# TODO - Dynamic Roadmap System (domains.json)

- [ ] Step 1: Implement backend roadmap generation from `smart-orientation-backend/data/domains.json`
  - [ ] Add helper to load `domains.json` and find domain by `field`/`aliases`/`keywords`
  - [ ] Build `SpecificRoadmap` (phases/skills/projects/resources/milestones, certifications, career_paths) strictly from JSON
  - [ ] Ensure roadmap selector filtering by Bac type uses the same domain.field groups derived from domains.json

- [ ] Step 2: Update backend endpoints/routes
  - [ ] Ensure `POST /chatbot/roadmap-selector` returns suggestions based on BAC-filtered domains
  - [ ] Ensure `GET /chatbot/roadmap?domain=...&level=...` returns full roadmap JSON for `RoadmapDisplay.tsx`
  - [ ] Ensure `POST /chatbot/ask` roadmap intent returns BEAUTIFUL markdown roadmap (no hardcoded text)

- [ ] Step 3: Refactor frontend
  - [ ] Remove `roadmapCardUi` and hardcoded bac→domain mapping from `orientation-frontend/app/components/ChatWidget.tsx`
  - [ ] Replace with dynamic fetch of roadmap selector cards (keep existing UI styles)
  - [ ] On card click: close selector + trigger roadmap request automatically

- [ ] Step 4: Validation
  - [ ] MATH/INFO show only IT-related roadmap domains
  - [ ] SVT shows only medical roadmap domains
  - [ ] ECO shows only business/economy/communication roadmap domains
  - [ ] LETTRES shows only translation/journalism/communication/law
  - [ ] SPORT shows only coaching/sport nutrition/prep domains
  - [ ] No static roadmap strings remain in frontend and backend


