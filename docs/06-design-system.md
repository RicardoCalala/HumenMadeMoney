# Human Made Money — Design System

## Purpose

The design system makes consequential commitments calm, legible, accessible, and trustworthy. It implements the Design Bible; it does not redefine product behavior.

## Brand and voice

Human Made Money should feel intelligent, trustworthy, human, and quietly forward-looking. Use plain language, name the actor, pair status with meaning, and explain consequences before an action. Label AI output as an assessment or recommendation, never a verdict.

## Themes and color

Support both light and dark themes with equal care. Follow the user or system preference and provide an explicit override where appropriate. Neither theme is mandatory.

Semantic color tokens—not raw colors—carry meaning:

- neutral surfaces and text for structure;
- trust/accent for focus and selected states;
- success for completed operations, not proof of correctness;
- warning for attention or incomplete information;
- danger for destructive, disputed, or failed states.

Every text and interactive state must meet WCAG 2.2 AA contrast. Never rely on color alone.

## Typography and layout

Use the established application type stack and design tokens. Prioritize readable body text, restrained display typography, clear hierarchy, generous spacing, and responsive layouts. Technical or financial identifiers may use a monospace token when it improves scanning.

## Core components

### Agreement card

Show purpose, human-readable state, participant context, next action, deadline, and protection status only when relevant. Do not make locked funds the universal focal point.

### Trust timeline

Show attributable events in chronological order: created, revised, accepted, activated, evidence submitted, assessed, reviewed, resolved, and closed. Distinguish facts, claims, system events, and AI inference.

### Evidence and assessment

Place sources, timestamps, matched terms, gaps, confidence, and review controls beside the conclusion. Avoid decorative certainty meters or unexplained scores.

### Money and protection

Show amount, currency, fees, custody/funding status, release or refund conditions, and the actor who can authorize the next step. Use step-up confirmation for consequential financial actions.

### Confirmation and recovery

Confirmation copy names the action, target agreement, consequence, reversibility, and failure behavior. Errors say what happened, whether state changed, and the safest next action.

## Navigation

Primary navigation may include Home, My Agreements, Protection, Verification, Organizations, and Settings. Hide capabilities that are unavailable or unauthorized. Agreement detail uses Overview, Terms, Participants, Evidence, Protection, Activity, and Resolution.

## Motion and interaction

Motion explains hierarchy or state change and remains brief, interruptible, and compatible with reduced-motion preferences. Keyboard focus is visible and logical. Loading, empty, permission, offline, expired-session, dispute, and recovery states receive complete designs.

## Content rules

- Prefer “agreement,” “participant,” “evidence,” “assessment,” “protect funds,” and “request review.”
- Use “challenge” only for a specific optional agreement template, not the core domain name.
- Avoid gambling language, adversarial framing, hype, and unsupported claims such as guaranteed, unbiased, instant, or legally binding.
- Never imply that AI independently decides a dispute or executes settlement.

## Governance checklist

New shared components require a documented need, semantic tokens, responsive behavior, accessibility behavior, and complete states. Review shared changes across marketing, agreement, evidence, and money surfaces. Validate keyboard access, screen reader output, zoom, contrast, reduced motion, and both supported themes.
