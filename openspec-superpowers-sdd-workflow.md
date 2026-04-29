# Why OpenSpec and Superpowers Work Better Together

## Where OpenSpec Falls Short When Used Alone

OpenSpec performs very well in incremental change management. The `propose → apply → archive` loop keeps the spec library clean and efficient. The `archive` step consolidates the delta spec while preserving historical traces for later review. It works well for iterative feature-by-feature development on an existing codebase.

But some problems are still obvious:

1. **Weak project cold start.**  
   OpenSpec is good at driving changes. But for a brand-new project, where you first need to define the architecture, tech stack, and domain model, `opsx:propose` has nothing to anchor itself to.

2. **Specs capture intent, not interaction.**  
   A spec tells the AI what to build, but UI details are often underestimated.

3. **`tasks.md` describes the “what,” not the “how.”**  
   `tasks.md` is a checklist. It does not contain an implementation plan for each task. The AI can fill in the blanks by itself, but the result is unstable. Sometimes it gets it right; sometimes it goes off track. Some tasks may even be quietly skipped.

4. **No testing discipline.**  


## Superpowers Fills the Gap

Superpowers is a set of Claude Code skills. For an SDD workflow, three of them are especially important:

- **`superpowers:brainstorming`**  
  Before you write any spec, it walks you through the idea using structured questions. It also includes Visual Companion, which can generate clickable HTML mockups that you can test in the browser. The final output is a Design Spec. **Automatically triggered by `/opsx:propose`.**

- **`superpowers:test-driven-development`**  
  Drives each task as a RED → GREEN → REFACTOR cycle: write the failing test first, implement the minimum code to pass, then refactor. **Automatically triggered by `/opsx:apply`.**

- **`superpowers:requesting-code-review`**  
  After each task group is completed, it automatically runs a review pass. Issues are classified as CRITICAL / HIGH / MEDIUM / LOW, with concrete fix suggestions. Invoked at task-group checkpoints during `/opsx:apply`.

OpenSpec manages change tracking and long-term spec accumulation. Superpowers manages upfront design, execution discipline, and review. They work at different layers, so they do not conflict. They can complement each other.

## What the SDLC Looks Like When Combining Both Tools



### Project Initialization, One Time Only

1. Then run `openspec init` and complete `config.yaml`, including the tech stack, coding standards, and testing strategy, such as unit, integration, and e2e tests.

2. Split requirements by priority. Treat `docs/log/` as a living log, and enforce in `CLAUDE.md` that every session must append an entry.

### For Each Feature

1. Run `/opsx:propose`. It automatically triggers `superpowers:brainstorming` first — for UI-heavy work, Visual Companion produces clickable mockups before any spec is written. Once the design is settled, the command generates `proposal.md`, `design.md`, and `tasks.md`.

2. Run `/opsx:apply`. It automatically triggers `superpowers:test-driven-development` to execute each task as RED → GREEN → REFACTOR. The skill splits the work into batches, writes tests first, implements the code, runs the test suite, and runs code review by batch.

3. Do a manual sanity check. At this point, very few bugs are usually found.

4. Deploy.

5. Run `/opsx:archive` to merge the delta spec back into the main spec library.

6. Review the day's log. Move new lessons learned into `CLAUDE.md` and `openspec/config.yaml`, and update the README if needed.

7. Commit and push, then move on to the next feature.

The division of labor between the two tools is clear: **Superpowers handles design and construction, while OpenSpec handles tracking and archival.**

## Is OpenSpec Still Necessary?

Since Superpowers is so useful, does that mean OpenSpec is redundant?

For me, it is still necessary for three reasons:

1. **Discipline for small-step iteration.**  
   `propose → apply → archive` creates a hard rhythm. It forces every change to have a clear scope, acceptance criteria, and archive step.

2. **A long-term spec library.**  
   `opsx:archive` syncs the delta spec back into the growing `openspec/specs/` tree. After a few months, this becomes the project’s authoritative specification, similar to how I use an LLM wiki as my core notebook. Superpowers specs and plans are per-change artifacts; they do not accumulate into a project-level view.

3. **Cross-checking completion.**  
   OpenSpec tasks and Superpowers plans can be compared against each other. If Superpowers finishes but OpenSpec still has open tasks, something was missed.

In one sentence: **OpenSpec manages the spec lifecycle, while Superpowers manages the design-to-execution loop within a single change.** Together, they provide both long-term structure and short-term implementation discipline.

## Key Takeaways

1. **Every new project should start with Brainstorming, not Propose.**  
   OpenSpec cannot bootstrap architecture from a single sentence. Superpowers’ structured questioning can.

2. **UI changes should always go through Visual Companion.**  
   A clickable mockup in 20 minutes can save hours of misaligned implementation. This is one of the highest-leverage tools in the entire workflow.

3. **Give TDD to Superpowers and archival to OpenSpec.**  
   Do not expect either tool to do both jobs well.

4. **Every mistake should go into `config.yaml`.**  
   The over-refactor from Batch 6 is now a prevention rule. That is the compounding advantage of SDD over vibe coding: mistakes become structure instead of being buried only in Git history.

5. **Keep a daily log.**  
   The habit of writing `docs/log/YYYY-MM-DD.md` makes retrospectives very cheap. It also becomes the source material for updating `CLAUDE.md` and `config.yaml`.
