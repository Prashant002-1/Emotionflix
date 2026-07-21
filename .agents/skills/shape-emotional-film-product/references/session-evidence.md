# Session evidence

This ledger records the full Emotionflix-scoped session inventory reviewed when this skill was created on 2026-07-16. It distinguishes direct user evidence from agent-generated supporting work. Use it to revise the skill without treating an unapproved agent idea as user taste.

## Evidence rules

- Direct user feedback, screenshots, explicit preservation requests, and approval followed by a commit are primary evidence.
- Agent audits, research, concepts, and implementation summaries are supporting evidence only.
- Runtime-only sessions establish workflow preferences but do not establish visual taste.
- Later direct feedback overrides earlier approval.

## Primary project sessions

| Session | Scope | Design evidence |
|---|---|---|
| `019f5dd0-8f6d-7340-bb80-97a808f01e2f` | Docker port collision | None. Runtime only. |
| `019f4d00-d5f2-7621-b04b-95f3e8c18371` | Local runtime, Docker dependencies, TMDB configuration | No visual direction. Strong preference for no browser inspection and direct execution. |
| `019f4d0e-118f-7bf0-9f48-6d2d5b22a7de` | First portfolio-grade overhaul | Established design-system-first, remove AI slop, make it a real product, abstract heuristics, real demo entry, implementation over broad testing. |
| `019f4d52-d844-7d63-b06b-0b75da686b2e` | Product-direction correction | Rejected dark/yellow generic redesign, security icon theater, face-capture framing, missing diary/personalization/social discovery, "check your mood," Font Awesome, underscaling, and frontend-only thinking. |
| `019f5988-6dab-7d61-8a00-322092de9a3b` | Product doctrine, palette exploration, landing and app redesign | Established response-not-review, people-led discovery, optional facial input, separate landing/app modes, Option C palette, coded preview, photographic grain, strong creative hand, Letterboxd as structural inspiration, and user-led visual review. |
| `019f5df3-706b-7dc2-8c89-38e0ce1cb3f7` | Runtime simplification | None. Runtime only. |
| `019f5f3c-f27a-75a3-a2f9-621a014fd198` | Long hero, landing, brand, motion, and in-app redesign | Main taste record. Contains hero overcorrection, research correction, Moodie rename, multi-film sequence, product-demo reset, palette restoration, direct-copy approval, ambient motion, header blending, footer compression, sidebar removal, real Feed hierarchy, Letterboxd/Beli guidance, and repeated preservation feedback. |
| `019f695c-777d-7121-b83b-13229deebfed` | Creation of this repo-local skill | Confirms the skill must remain inside this project and disappear with the checkout. |

## Supporting delegated sessions

| Session | Agent task | Contribution and authority |
|---|---|---|
| `019f5dca-7e95-7e01-8d5e-c203b06141d5` | Social feed and seed implementation | Supporting implementation. Made response data longer, first-person, people-led, and rating-free. |
| `019f5f3d-6e59-7f82-b211-d71bf16e24e9` | Hero code audit | Supporting diagnosis. Found stacked timing, unrelated data, remounts, invalid motion variables, and the clean hero-only seam. |
| `019f5f3d-81e5-7d50-9ed4-2e7aad579b45` | Product story audit | Supporting doctrine. Kept the illustrative journey faithful to people-led matching and avoided genre inference. |
| `019f5f3d-9ba8-72d1-bbce-5f9da710b9c3` | Motion concept | Supporting concept only. The full-width passed-response approach was not approved after implementation. |
| `019f5f49-b747-7d30-ace0-44323e581f70` | Static hero review | Supporting QA. No direct taste authority. |
| `019f5f52-1a3c-7501-929f-141bb2a890ac` | Left-side art direction | Supporting correction. Proposed one restrained registration effect while preserving the right side. |
| `019f5f52-2955-7cc0-bcc6-f584b960748d` | Restore-seam audit | Supporting preservation map. Identified how to freeze the approved right-side scene. |
| `019f5f52-3d60-7771-9167-27cb37ba6bc8` | Hero card story | Supporting copy and crossfade sequence. No independent user approval. |
| `019f628b-361c-79e3-be14-156e49ed3b18` | Seed-response refinement | Supporting implementation. Added context, contradiction, residue, and discovery intent to response copy. |
| `019f6883-313f-7451-80ea-329f7f39052e` | Landing CSS audit | Supporting diagnosis based on direct screenshots. No edits. |
| `019f688b-a54d-7f20-b88c-3b734c969ca5` | Polish diff review | Supporting verification. Found double-grain footer risk and the remaining TMDB teal mark. |

## Explicit approval chain

Use approval chains to distinguish "better" from final taste:

1. Option C visual board was preferred over the dark palette.
2. The coded Option C preview was called "really nice" after the material direction became visible.
3. The texture needed correction from dots to granular photographic grain before the system was finalized.
4. The broad Moodie landing direction was called better, while the older response-card shadow and UI were explicitly requested back.
5. The synchronized posters, reactions, and text transitions were explicitly retained.
6. The restored palette and focused correction culminated in `f15db1f`, which was called "great, much much better" and immediately checkpointed.
7. Header blending needed two more iterations. The user approved and requested commit after `bc7d64c`.

Do not infer approval from a passing build, an agent's positive summary, or the absence of immediate feedback.
