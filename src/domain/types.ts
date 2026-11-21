import { z } from 'zod';

export const AirCategorySchema = z.enum(['good', 'satisfactory', 'moderate', 'poor', 'very-poor', 'severe']);
export type AirCategory = z.infer<typeof AirCategorySchema>;

export const HourlyPointSchema = z.object({ t: z.string(), pm25: z.number(), aqi: z.number() });
export type HourlyPoint = z.infer<typeof HourlyPointSchema>;

export const AirSchema = z.object({
  at: z.string(),
  pm25: z.number().nonnegative(),
  pm10: z.number().nonnegative(),
  aqi: z.number().min(0).max(500),
  category: AirCategorySchema,
  dominant: z.enum(['pm25', 'pm10']),
  visibilityKm: z.number().optional(),
  windKmh: z.number(),
  tempC: z.number(),
  rh: z.number(),
  stagnant: z.boolean(),
  hourly: z.array(HourlyPointSchema),
  source: z.enum(['live', 'cache', 'manual']),
  ageMin: z.number(),
});
export type Air = z.infer<typeof AirSchema>;

export const MemberSchema = z.object({
  band: z.enum(['infant', 'child', 'adult', 'senior']),
  sensitive: z.boolean().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

export const HomeProfileSchema = z.object({
  type: z.enum(['apartment', 'house']),
  floor: z.enum(['low', 'mid', 'high']),
  windows: z.enum(['leaky', 'tight']),
  ac: z.boolean(),
  purifier: z.enum(['none', 'bedroom', 'living', 'both']),
  cooking: z.enum(['lpg', 'png', 'induction', 'biomass']),
  chimney: z.boolean(),
});
export type HomeProfile = z.infer<typeof HomeProfileSchema>;

export const MobilityProfileSchema = z.object({
  mode: z.enum(['walk', 'two-wheeler', 'auto', 'bus', 'metro', 'car-recirc', 'car-open']),
  distance: z.enum(['short', 'mid', 'long']),
  wfhDays: z.number(),
  schoolAge: z.boolean(),
  exercisesOutdoors: z.boolean(),
});
export type MobilityProfile = z.infer<typeof MobilityProfileSchema>;

export const HouseholdSchema = z.object({
  members: z.array(MemberSchema).min(1),
  home: HomeProfileSchema,
  mobility: MobilityProfileSchema,
  budget: z.enum(['free', 'low', 'mid']),
  lang: z.enum(['en', 'hi']),
});
export type Household = z.infer<typeof HouseholdSchema>;

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  name: z.string().optional(),
  admin: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const MemberRiskSchema = z.object({
  band: z.string().optional(),
  tier: z.number().min(0).max(5),
  message: z.string().optional(),
  sensitive: z.boolean().optional(),
});
export type MemberRisk = z.infer<typeof MemberRiskSchema>;

export const SpanSchema = z.object({ start: z.string(), end: z.string() });
export type Span = z.infer<typeof SpanSchema>;

export const WindowResultSchema = z.object({
  best: SpanSchema,
  worst: SpanSchema,
  pm25AtBest: z.number(),
  pm25NowAvg: z.number(),
});
export type WindowResult = z.infer<typeof WindowResultSchema>;

export const ActionImpactSchema = z.object({
  exposureDeltaPct: z.number().optional(),
  co2eKgDay: z.number().optional(),
  pmTier: z.enum(['high', 'medium', 'low']).optional(),
});
export type ActionImpact = z.infer<typeof ActionImpactSchema>;

export const ChosenActionSchema = z.object({
  id: z.string().min(1),
  domain: z.enum(['indoor', 'commute', 'cooking', 'heating', 'community', 'habit']).optional(),
  title: z.union([z.string(), z.record(z.string())]).optional(),
  why: z.union([z.string(), z.record(z.string())]).optional(),
  impact: ActionImpactSchema.optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  effort: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  cost: z.enum(['free', 'low', 'mid']).optional(),
});
export type ChosenAction = z.infer<typeof ChosenActionSchema>;

export const BlockSchema = z.object({
  id: z.string().min(1),
  span: SpanSchema.optional(),
  env: z.string().optional(),
  actions: z.array(ChosenActionSchema),
});
export type Block = z.infer<typeof BlockSchema>;

export const SimulationBlockSchema = z.object({
  id: z.string(),
  hours: z.number(),
  cOut: z.number(),
  envFactor: z.number(),
  activityFactor: z.number(),
  protectionFactor: z.number(),
  indoorSource: z.number(),
});
export type SimulationBlock = z.infer<typeof SimulationBlockSchema>;

export const ActionModifierSchema = z.object({
  block: z.string(),
  set: z.object({
    envFactor: z.number().optional(),
    protectionFactor: z.number().optional(),
    activityFactor: z.number().optional(),
    indoorSource: z.number().optional(),
    hours: z.number().optional(),
  }).optional(),
});
export type ActionModifier = z.infer<typeof ActionModifierSchema>;

export const DayPlanSchema = z.object({
  air: AirSchema,
  risks: z.array(MemberRiskSchema),
  blocks: z.array(BlockSchema),
  baseline: z.number().optional(),
  planned: z.number().optional(),
  window: z.object({ best: SpanSchema, worst: SpanSchema }).optional(),
  civic: z.string().optional(),
  season: z.string().optional(),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;
