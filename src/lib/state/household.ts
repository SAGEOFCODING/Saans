import { Household, Location, Air } from '@/domain/types';

export const STORAGE_KEY = 'saans_household_v1';

export const DEFAULT_LOCATION: Location = {
  lat: 28.61,
  lon: 77.21,
  name: 'Delhi NCR',
  admin: 'Delhi',
};

export const DEFAULT_HOUSEHOLD: Household = {
  members: [{ band: 'adult', sensitive: false }],
  home: {
    type: 'apartment',
    floor: 'mid',
    windows: 'leaky',
    ac: false,
    purifier: 'none',
    cooking: 'png',
    chimney: false,
  },
  mobility: {
    mode: 'car-recirc',
    distance: 'mid',
    wfhDays: 2,
    schoolAge: false,
    exercisesOutdoors: false,
  },
  budget: 'mid',
  lang: 'en',
};

export interface HouseholdState {
  step: number;
  location: Location;
  household: Household;
  manualAir?: Partial<Air>;
}

export type HouseholdAction =
  | { type: 'SET_LOCATION'; payload: Location }
  | { type: 'SET_HOUSEHOLD'; payload: Partial<Household> }
  | { type: 'UPDATE_HOME'; payload: Partial<Household['home']> }
  | { type: 'UPDATE_MOBILITY'; payload: Partial<Household['mobility']> }
  | { type: 'SET_MEMBERS'; payload: Household['members'] }
  | { type: 'LOAD_PRESET'; payload: Household }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LANG'; payload: 'en' | 'hi' }
  | { type: 'SET_MANUAL_AIR'; payload?: Partial<Air> }
  | { type: 'RESTORE_STATE'; payload: HouseholdState }
  | { type: 'RESET' };

export const initialHouseholdState: HouseholdState = {
  step: 1,
  location: DEFAULT_LOCATION,
  household: DEFAULT_HOUSEHOLD,
};

export function householdReducer(state: HouseholdState, action: HouseholdAction): HouseholdState {
  let nextState: HouseholdState;
  switch (action.type) {
    case 'SET_LOCATION':
      nextState = { ...state, location: action.payload };
      break;
    case 'SET_HOUSEHOLD':
      nextState = { ...state, household: { ...state.household, ...action.payload } };
      break;
    case 'UPDATE_HOME':
      nextState = {
        ...state,
        household: { ...state.household, home: { ...state.household.home, ...action.payload } },
      };
      break;
    case 'UPDATE_MOBILITY':
      nextState = {
        ...state,
        household: { ...state.household, mobility: { ...state.household.mobility, ...action.payload } },
      };
      break;
    case 'SET_MEMBERS':
      nextState = {
        ...state,
        household: { ...state.household, members: action.payload },
      };
      break;
    case 'LOAD_PRESET':
      nextState = {
        ...state,
        household: action.payload,
        step: 5,
      };
      break;
    case 'SET_STEP':
      nextState = { ...state, step: Math.max(1, Math.min(5, action.payload)) };
      break;
    case 'SET_LANG':
      nextState = {
        ...state,
        household: { ...state.household, lang: action.payload },
      };
      break;
    case 'SET_MANUAL_AIR':
      nextState = { ...state, manualAir: action.payload };
      break;
    case 'RESTORE_STATE':
      return action.payload;
    case 'RESET':
      nextState = initialHouseholdState;
      break;
    default:
      return state;
  }

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore sessionStorage quota errors
    }
  }
  return nextState;
}

export function loadStoredHouseholdState(): HouseholdState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HouseholdState;
  } catch {
    return null;
  }
}
