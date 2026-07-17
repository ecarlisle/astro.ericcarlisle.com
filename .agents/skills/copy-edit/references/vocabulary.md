# Vocabulary Guide

A lightweight terminology and usage reference. Populated with terms and distinctions that can be supported by repository content. Additions should come from authentic usage, not invented preferences.

---

## Agent

**Preferred:** agent, coding agent, AI agent  
**Avoid:** AI assistant (when referring to a coding agent specifically), bot  
**Reason:** The project uses agent-based tooling and distinguishes agents from assistants. "Assistant" implies a different interaction model.  
**Example:** "Repo-aware coding agents like Codex, OpenCode, and Pi."

---

## Deterministic vs. Probabilistic

**Preferred:** deterministic behavior, probabilistic interpretation  
**Avoid:** Using these terms interchangeably or treating AI output as rule-based  
**Reason:** This is a foundational distinction in the project's technical writing about AI. Deterministic systems have explicit rules. Probabilistic systems make judgment calls. Collapsing them produces misleading explanations.  
**Example:** "With AI I wasn't configuring a deterministic system. I was shaping the context that a probabilistic one used to make a judgment call."

---

## Context

**Preferred:** context, shaped context, agent context  
**Avoid:** prompt (when the reference is to broader context rather than a single instruction)  
**Reason:** The project distinguishes between a prompt (a direct instruction) and the broader context that shapes agent behavior. Context includes documentation, rules, skill files, and other durable reference material.  
**Example:** "I needed context that gives an agent a stable place to stand."

---

## Instructions vs. Context

**Preferred:** instructions, context, shaped context  
**Avoid:** Blurring the distinction between a command and the environment it runs in  
**Reason:** A recurring theme: instructions matter, but they are not rules. They are more like suggestions shaped by the surrounding context.  
**Example:** "The instructions still mattered, but they just weren't rules anymore. They were more like suggestions with a mood."

---

## Capability vs. Dependency

**Preferred:** capable of, depends on  
**Avoid:** "Can do X" when the agent relies on specific tools or configuration  
**Reason:** The project distinguishes what a system can do in principle from what it can do given its current setup.  
**Example:** [Awaiting an authentic example from repository content.]

---

## Assistance vs. Replacement

**Preferred:** assist, augment, support  
**Avoid:** replace, substitute, automate away  
**Reason:** The project frames AI as an augmentation of developer judgment, not a replacement for it.  
**Example:** [Awaiting an authentic example from repository content.]

---

## Consistency vs. Ambiguity

**Preferred:** consistent, predictable, unambiguous  
**Avoid:** "always works," "never fails"  
**Reason:** The project treats inconsistency as a symptom of ambiguity, not as random behavior. Reducing ambiguity improves consistency.  
**Example:** "Inconsistency was the symptom. Ambiguity was the actual problem."

---

## Technical Possibility vs. Maintainable Practice

**Preferred:** possible, practical, maintainable  
**Avoid:** "You should," "You must," "Always do X" — when the advice depends on context  
**Reason:** The project prefers conditional recommendations over absolute rules. What is technically possible is not always a maintainable practice.  
**Example:** [Awaiting an authentic example from repository content.]

---

## Configuration vs. Context

**Preferred:** configuration, prescriptive configuration, shaped context  
**Avoid:** conflating a config file with the broader notion of context  
**Reason:** Configuration is explicit and rule-based. Context is broader and shapes probabilistic behavior. This distinction appears repeatedly in the project's AI-related writing.  
**Example:** "I'd gotten used to prescriptive configuration doing the heavy lifting. A formatter config or build script has explicit rules."

---

## Person-First vs. Tool-First Framing

**Preferred:** developer, engineer, writer  
**Avoid:** "user" when referring to someone who writes code or creates content  
**Reason:** The project writes about people doing skilled work, not about abstract users of a system.  
**Example:** [Awaiting an authentic example from repository content.]

---

## Project-Specific Terms

| Term | Usage |
|---|---|
| Pagefind | Static site search tool; capital P |
| Astro | The static site framework; capital A |
| Biome | The linter and formatter; capital B |
| Cloudflare Worker | Proper noun, both words capitalized |
| MDX | All caps |
| Graphify | The knowledge graph tool; capital G |

---

## Phrases to Use Sparingly

- "In practice" — useful for contrast, loses force with repetition
- "It turns out" — same problem; reserve for genuine revelations
- "Of course" — can sound dismissive even when not intended that way

---

## Phrases to Avoid

- "In today's rapidly evolving landscape"
- "It is important to note"
- "At its core"
- "This underscores the importance of"
- "This serves as a reminder"
- "The key takeaway"
- "Navigating the complexities of"
- "A powerful testament"
- "Transformative"
- "Game-changing"
- "Delve"
- "Leverage" (when "use" is sufficient)
- Decorative "not just X, but Y" constructions
