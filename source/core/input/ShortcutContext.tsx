/**
 * Shortcut Context
 * React Context and Hooks for using ShortcutManager
 */

import React, {createContext, useContext, useEffect, useRef} from 'react';
import {useInput} from 'ink';
import {ShortcutManager} from './ShortcutManager';
import type {
  ShortcutDefinition,
  ShortcutLayer,
  RegisteredShortcut,
  ShortcutManagerConfig,
} from './types';

interface ShortcutContextValue {
  manager: ShortcutManager;
  setActiveLayer: (layer: ShortcutLayer) => void;
  getActiveLayer: () => ShortcutLayer;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

interface ShortcutProviderProps {
  children: React.ReactNode;
  config?: ShortcutManagerConfig;
  debug?: boolean;
}

/**
 * ShortcutProvider - Provides ShortcutManager to the component tree
 * Should be placed at the root of the app
 */
export function ShortcutProvider({
  children,
  config,
  debug = false,
}: ShortcutProviderProps) {
  const managerRef = useRef<ShortcutManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new ShortcutManager({
      debug,
      ...config,
    });
  }

  const manager = managerRef.current;

  useInput((input, key) => {
    manager.handleInput(input, key);
  });

  const contextValue: ShortcutContextValue = {
    manager,
    setActiveLayer: (layer: ShortcutLayer) => manager.setActiveLayer(layer),
    getActiveLayer: () => manager.getActiveLayer(),
  };

  return (
    <ShortcutContext.Provider value={contextValue}>
      {children}
    </ShortcutContext.Provider>
  );
}

/**
 * useShortcutManager - Access the ShortcutManager instance
 */
export function useShortcutManager(): ShortcutContextValue {
  const context = useContext(ShortcutContext);

  if (!context) {
    throw new Error(
      'useShortcutManager must be used within ShortcutProvider',
    );
  }

  return context;
}

/**
 * useShortcut - Register a shortcut with automatic cleanup
 * Shortcut is registered on mount and unregistered on unmount
 *
 * @example
 * useShortcut({
 *   key: 'shift+tab',
 *   handler: () => toggleMode(),
 *   layer: 'screen',
 *   enabled: () => !isLoading,
 *   description: 'Toggle permission mode'
 * });
 */
export function useShortcut(definition: ShortcutDefinition): void {
  const {manager} = useShortcutManager();
  const definitionRef = useRef(definition);

  useEffect(() => {
    definitionRef.current = definition;
  }, [definition]);

  useEffect(() => {
    const id = manager.register({
      ...definitionRef.current,
      handler: () => definitionRef.current.handler(),
      enabled: definitionRef.current.enabled
        ? () => definitionRef.current.enabled!()
        : undefined,
    });

    return () => {
      manager.unregister(id);
    };
  }, [manager, definition.key, definition.layer]);
}

/**
 * useShortcuts - Register multiple shortcuts at once
 *
 * @example
 * useShortcuts([
 *   { key: '?', handler: toggleHelp, layer: 'screen' },
 *   { key: 'escape', handler: closeHelp, layer: 'screen' },
 * ]);
 */
export function useShortcuts(definitions: ShortcutDefinition[]): void {
  const {manager} = useShortcutManager();

  useEffect(() => {
    const ids: string[] = [];

    for (const def of definitions) {
      const id = manager.register(def);
      ids.push(id);
    }

    return () => {
      for (const id of ids) {
        manager.unregister(id);
      }
    };
  }, [manager, definitions]);
}

/**
 * useLayerSwitch - Automatically switch layers based on condition
 *
 * @example
 * // Switch to dialog layer when dialog is open
 * useLayerSwitch('dialog', dialogVisible);
 *
 * // Switch to input layer when input is focused
 * useLayerSwitch('input', inputFocused);
 */
export function useLayerSwitch(
  layer: ShortcutLayer,
  active: boolean,
  fallbackLayer: ShortcutLayer = 'screen',
): void {
  const {setActiveLayer} = useShortcutManager();

  useEffect(() => {
    if (active) {
      setActiveLayer(layer);
    } else {
      setActiveLayer(fallbackLayer);
    }
  }, [active, layer, fallbackLayer, setActiveLayer]);
}

/**
 * useShortcutDebug - Hook for debugging shortcuts
 * Logs shortcut state on demand
 */
export function useShortcutDebug(): {
  logState: () => void;
  getActiveShortcuts: () => RegisteredShortcut[];
} {
  const {manager} = useShortcutManager();

  return {
    logState: () => manager.logState(),
    getActiveShortcuts: () => manager.getActiveShortcuts(),
  };
}
