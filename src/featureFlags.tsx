import React, { createContext, useContext, useMemo } from 'react';

type FeatureFlags = {
  gpt5Preview: boolean;
};

const defaultFlags: FeatureFlags = {
  // Default to enabled for all clients unless explicitly disabled
  gpt5Preview: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

function parseBool(val: string | undefined, fallback: boolean): boolean {
  if (val === undefined) return fallback;
  const v = val.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export const FeatureFlagsProvider: React.FC<{
  children: React.ReactNode;
  overrides?: Partial<FeatureFlags>;
}> = ({ children, overrides }) => {
  const envGpt5 = parseBool(process.env.REACT_APP_ENABLE_GPT5_PREVIEW, true);
  const value = useMemo<FeatureFlags>(
    () => ({ gpt5Preview: overrides?.gpt5Preview ?? envGpt5 }),
    [envGpt5, overrides?.gpt5Preview]
  );
  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export function useFeatureFlag(name: keyof FeatureFlags): boolean {
  const flags = useContext(FeatureFlagsContext);
  return flags[name];
}

export default FeatureFlagsContext;
