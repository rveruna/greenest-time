import { describeFeature, type loadFeature, type StepTest } from '@amiceli/vitest-cucumber';

/**
 * Binds a feature file's rules to step definitions, so the rules run as tests under `npm test`.
 *
 * Every scenario in the file is run, so a new scenario needs only a change to the `.feature` file, as long as
 * its steps match one already defined. A step with no match fails the whole file with its text, rather than
 * being skipped. A scenario tagged `@bug` is shown as skipped: it is a rule the code breaks today.
 */
type Feature = Awaited<ReturnType<typeof loadFeature>>;
type Scenario = Feature['scenarii'][number] & { examples?: Record<string, string>[] };

/** A step pattern, matched against the whole step text, and what it does. Capture groups become arguments. */
export type Step<World> = [pattern: RegExp, run: (world: World, ...args: string[]) => void];

export function runRules<World>(feature: Feature, newWorld: () => World, steps: Step<World>[]): void {
  const bind = (scenario: Scenario, api: StepTest, example: Record<string, string> = {}) => {
    const world = newWorld();
    for (const step of scenario.steps) {
      const text = step.details.replace(/<([^>]+)>/g, (whole, key: string) => example[key] ?? whole);
      const match = steps
        .map(([pattern, run]) => ({ run, args: text.match(new RegExp(`^${pattern.source}$`))?.slice(1) }))
        .find((m) => m.args);
      if (!match) throw new Error(`No step definition matches "${step.type} ${text}" in ${feature.name}`);
      api[step.type](step.details, () => match.run(world, ...match.args!));
    }
  };

  const options = { excludeTags: ['ignore', 'bug'] };
  describeFeature(
    feature,
    ({ Scenario, ScenarioOutline, Rule }) => {
      for (const s of feature.scenarii as Scenario[]) {
        if (s.examples) ScenarioOutline(s.description, (api, example) => bind(s, api, example));
        else Scenario(s.description, (api) => bind(s, api));
      }
      for (const rule of feature.rules) {
        Rule(rule.name, ({ RuleScenario, RuleScenarioOutline }) => {
          for (const s of rule.scenarii as Scenario[]) {
            if (s.examples) RuleScenarioOutline(s.description, (api, example) => bind(s, api, example));
            else RuleScenario(s.description, (api) => bind(s, api));
          }
        });
      }
    },
    options,
  );
}
