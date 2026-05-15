import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

// ── Storage key ──────────────────────────────────────────────────────────────
// Versioned — bump the suffix if the item schema changes incompatibly so old
// carts get wiped instead of crashing.
const STORAGE_KEY = 'cnc_cart_v1';

// Item shape:
//   { key, source, id, title, image, price, qty, isPreorder, etaText?, currency }
// Where:
//   key        = `${source}:${id}` — merge target for addItem
//   source     = 'singles' | 'products' | 'preorders'
//   id         = the source-table primary key
//   price      = unit price in CAD (number)
//   qty        = integer >= 1
//   isPreorder = boolean (visual flag + shipping caveat)
//   etaText    = optional pre-order ETA string for cart line
//   currency   = always 'CAD' for now — kept for future multi-currency carts

function loadInitial() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Light validation — drop malformed rows rather than crash the app.
    return parsed.filter(it =>
      it && typeof it === 'object'
      && typeof it.key === 'string'
      && typeof it.id === 'string'
      && typeof it.source === 'string'
      && Number.isFinite(it.price)
      && Number.isInteger(it.qty) && it.qty > 0
    );
  } catch {
    return [];
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const incoming = action.item;
      const key = incoming.key || `${incoming.source}:${incoming.id}`;
      const next = { ...incoming, key, qty: Math.max(1, Number(incoming.qty) || 1) };
      const idx = state.findIndex(it => it.key === key);
      if (idx === -1) return [...state, next];
      const merged = [...state];
      merged[idx] = { ...merged[idx], qty: merged[idx].qty + next.qty };
      return merged;
    }
    case 'remove':
      return state.filter(it => it.key !== action.key);
    case 'updateQty': {
      const qty = Math.max(1, Math.floor(Number(action.qty) || 1));
      return state.map(it => (it.key === action.key ? { ...it, qty } : it));
    }
    case 'clear':
      return [];
    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Quota exceeded or storage disabled — silently degrade.
    }
  }, [items]);

  const value = useMemo(() => {
    const subtotalInStock = items
      .filter(it => !it.isPreorder)
      .reduce((sum, it) => sum + Number(it.price) * it.qty, 0);
    const subtotalPreorder = items
      .filter(it => it.isPreorder)
      .reduce((sum, it) => sum + Number(it.price) * it.qty, 0);
    const itemCount = items.reduce((sum, it) => sum + it.qty, 0);
    const lineCount = items.length;

    return {
      items,
      addItem: item => dispatch({ type: 'add', item }),
      removeItem: key => dispatch({ type: 'remove', key }),
      updateQty: (key, qty) => dispatch({ type: 'updateQty', key, qty }),
      clear: () => dispatch({ type: 'clear' }),
      totals: {
        subtotalInStock,
        subtotalPreorder,
        subtotal: subtotalInStock + subtotalPreorder,
        itemCount,
        lineCount,
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
