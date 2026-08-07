import { useState, useEffect, useCallback, useRef } from "react";
import { db, doc, getDoc, setDoc } from "../firebase.js";

const DEFAULT_CATEGORIES = ["Food", "Rent", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "Other"];
const DEFAULT_STATE = {
  expenses: [],
  budgets: {},
  categories: [...DEFAULT_CATEGORIES],
  settings: { currency: "$", theme: "dark", totalBudget: 0, displayName: "", budgetAlertsEnabled: true, weeklySummaryEnabled: false },
};

export function useExpenseData(uid) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const docRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      docRef.current = null;
      setState(DEFAULT_STATE);
      setLoading(false);
      setLoadError(null);
      return;
    }
    docRef.current = doc(db, "users", uid);
    setLoading(true);
    setLoadError(null);
    getDoc(docRef.current).then(snap => {
      if (cancelled) return;
      const data = snap.exists() ? snap.data() : {};
      setState({
        settings: { currency: "$", theme: "dark", totalBudget: 0, displayName: "", budgetAlertsEnabled: true, weeklySummaryEnabled: false, ...(data.settings || {}) },
        categories: Array.isArray(data.categories) && data.categories.length ? data.categories : [...DEFAULT_CATEGORIES],
        budgets: data.budgets || {},
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
      });
      setLoading(false);
    }).catch(err => {
      if (cancelled) return;
      console.error("Failed to load expense data:", err);
      setLoadError(err);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const persistExpenses = useCallback((expenses) => {
    if (!docRef.current) return Promise.resolve();
    return setDoc(docRef.current, { expenses }, { merge: true });
  }, []);

  const persistProfile = useCallback((next) => {
    if (!docRef.current) return Promise.resolve();
    return setDoc(docRef.current, {
      settings: next.settings,
      categories: next.categories,
      budgets: next.budgets,
    }, { merge: true });
  }, []);

  const addExpense = useCallback((expense) => {
    setState(prev => {
      const next = { ...prev, expenses: [...prev.expenses, { id: crypto.randomUUID(), ...expense }] };
      persistExpenses(next.expenses).catch(err => console.error("Failed to save expense:", err));
      return next;
    });
  }, [persistExpenses]);

  const updateExpense = useCallback((id, patch) => {
    setState(prev => {
      const expenses = prev.expenses.map(e => (e.id === id ? { ...e, ...patch } : e));
      const next = { ...prev, expenses };
      persistExpenses(expenses).catch(err => console.error("Failed to save expense update:", err));
      return next;
    });
  }, [persistExpenses]);

  const deleteExpense = useCallback((id) => {
    setState(prev => {
      const expenses = prev.expenses.filter(e => e.id !== id);
      const next = { ...prev, expenses };
      persistExpenses(expenses).catch(err => console.error("Failed to save expense deletion:", err));
      return next;
    });
  }, [persistExpenses]);

  const deleteExpenses = useCallback((ids) => {
    setState(prev => {
      const idSet = new Set(ids);
      const expenses = prev.expenses.filter(e => !idSet.has(e.id));
      const next = { ...prev, expenses };
      persistExpenses(expenses).catch(err => console.error("Failed to save bulk expense deletion:", err));
      return next;
    });
  }, [persistExpenses]);

  const addCategory = useCallback((name) => {
    setState(prev => {
      const categories = [...prev.categories, name];
      const next = { ...prev, categories };
      persistProfile(next).catch(err => console.error("Failed to save category:", err));
      return next;
    });
  }, [persistProfile]);

  const removeCategory = useCallback((name) => {
    setState(prev => {
      const categories = prev.categories.filter(c => c !== name);
      const budgets = { ...prev.budgets };
      delete budgets[name];
      const next = { ...prev, categories, budgets };
      persistProfile(next).catch(err => console.error("Failed to save category removal:", err));
      return next;
    });
  }, [persistProfile]);

  const setBudget = useCallback((category, value) => {
    setState(prev => {
      const budgets = { ...prev.budgets };
      const num = parseFloat(value);
      if (!value || Number.isNaN(num) || num <= 0) delete budgets[category];
      else budgets[category] = num;
      const next = { ...prev, budgets };
      persistProfile(next).catch(err => console.error("Failed to save budget:", err));
      return next;
    });
  }, [persistProfile]);

  const setCurrency = useCallback((currency) => {
    setState(prev => {
      const settings = { ...prev.settings, currency };
      const next = { ...prev, settings };
      persistProfile(next).catch(err => console.error("Failed to save currency setting:", err));
      return next;
    });
  }, [persistProfile]);

  const setDisplayName = useCallback((displayName) => {
    setState(prev => {
      const settings = { ...prev.settings, displayName };
      const next = { ...prev, settings };
      persistProfile(next).catch(err => console.error("Failed to save display name:", err));
      return next;
    });
  }, [persistProfile]);

  const setBudgetAlertsEnabled = useCallback((budgetAlertsEnabled) => {
    setState(prev => {
      const settings = { ...prev.settings, budgetAlertsEnabled };
      const next = { ...prev, settings };
      persistProfile(next).catch(err => console.error("Failed to save budget alerts setting:", err));
      return next;
    });
  }, [persistProfile]);

  const setWeeklySummaryEnabled = useCallback((weeklySummaryEnabled) => {
    setState(prev => {
      const settings = { ...prev.settings, weeklySummaryEnabled };
      const next = { ...prev, settings };
      persistProfile(next).catch(err => console.error("Failed to save weekly summary setting:", err));
      return next;
    });
  }, [persistProfile]);

  const setTotalBudget = useCallback((value) => {
    setState(prev => {
      const num = parseFloat(value);
      const totalBudget = !value || Number.isNaN(num) || num <= 0 ? 0 : num;
      const settings = { ...prev.settings, totalBudget };
      const next = { ...prev, settings };
      persistProfile(next).catch(err => console.error("Failed to save total budget:", err));
      return next;
    });
  }, [persistProfile]);

  const setThemePreference = useCallback((theme) => {
    setState(prev => {
      const settings = { ...prev.settings, theme };
      const next = { ...prev, settings };
      persistProfile(next).catch(err => console.error("Failed to save theme setting:", err));
      return next;
    });
  }, [persistProfile]);

  const clearAll = useCallback(() => {
    setState(prev => {
      const next = {
        expenses: [],
        budgets: {},
        categories: [...DEFAULT_CATEGORIES],
        settings: { ...prev.settings },
      };
      persistExpenses(next.expenses).catch(err => console.error("Failed to clear expenses:", err));
      persistProfile(next).catch(err => console.error("Failed to clear profile data:", err));
      return next;
    });
  }, [persistExpenses, persistProfile]);

  return { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, setTotalBudget, setThemePreference, clearAll };
}
