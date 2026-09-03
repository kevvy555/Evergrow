# v0.6 Playtest response

## Feedback

Three early reviewers produced a useful split:

- two described the game as boring, unclear and not enjoyable/addictive;
- both also struggled to understand how combinations worked;
- one reviewer specifically liked the simple tapping interaction.

The response is therefore **not** to add more systems. The tapping concept has signal, while the combination language and first-minute comprehension do not.

## Primary diagnosis

The previous build violated a basic interaction expectation: tapping an occupied tile silently created growth in a neighbouring tile. This broke cause-and-effect and made the spatial merge rule harder to infer.

At the same time, Flow, Sparks, Bloom, Perfect Merges, weather and later systems could appear before the player had internalised the base rule.

A player who does not understand the core cannot appreciate the depth layered on top of it.

## v0.6 principle

**Make one rule obvious, satisfying and repeatable before revealing another.**

The first-session loop is now:

1. Tap an empty tile.
2. A Sprout appears exactly there.
3. Two touching matches visibly glow and show `2/3`.
4. Put a third matching tile beside them.
5. The game explicitly reports `3 🌱 → 🌳`.
6. Repeat the same understandable rule with Trees.
7. After reaching Grove, deeper systems start to appear.

## Tap Boost

One reviewer positively reacted to tapping, so v0.6 strengthens that behaviour without adding a new control or random reward.

After the first Tree is learned, every six valid growth taps charge a deterministic Tap Boost. A full Boost makes the next empty tap plant a Tree.

This creates a small repeating anticipation loop:

`tap → tap → tap → progress → BOOST READY → stronger tap → reset`

There is no real-time timer, loss condition or hidden probability.

## Progressive disclosure

Feature unlocks now follow demonstrated comprehension:

- **Start:** tap + match 3 only.
- **Tree:** Tap Boost and Flow become understandable extensions.
- **Grove:** Spark, Bloom, Resonance, Radiants and evolution can appear.
- **Village:** weather, Wonders and the living settlement layer become relevant.

The systems from v0.5 are retained; they simply stop competing with the tutorial-quality core loop.

## Evaluation goal

The next playtest should focus on only three questions:

1. Can a new player explain the merge rule after 30 seconds without help?
2. Does the first Tree/Grove feel satisfying enough to make them continue?
3. Does Tap Boost make repeated tapping feel purposeful rather than empty?

If players still understand the rule but report boredom, the next problem is the core reward cadence itself. If they still cannot explain the rule, more features should not be added.
