import { useState, useEffect, useCallback, useRef } from "react";
import { db, doc, getDoc, setDoc } from "../firebase.js";

const DEFAULT_CATEGORIES = ["Food", "Rent", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "Other"];
const DEFAULT_STATE = {
  expenses: [],
  budgets: {},
  categories: [...DEFAULT_CATEGORIES],
  settings: { currency: "$", theme: "dark" },
};

export function useExpenseData(uid) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const docRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      setState(DEFAULT_STATE);
      setLoading(false);
      return;
    }
    docRef.current = doc(db, "users", uid);
    setLoading(true);
    getDoc(docRef.current).then(snap => {
      const data = snap.exists() ? snap.data() : {};
      setState({
        settings: { currency: "$", theme: "dark", ...(data.settings || {}) },
        categories: Array.isArray(data.categories) && data.categories.length ? data.categories : [...DEFAULT_CATEGORIES],
        budgets: data.budgets || {},
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
      });
      setLoading(false);
    });
  }, [uid]);

  const persistExpenses = useCallback((expenses) => {
    if (docRef.current) setDoc(docRef.current, { expenses }, { merge: true });
  }, []);

  const persistProfile = useCallback((next) => {
    if (docRef.current) {
      setDoc(docRef.current, {
        settings: next.settings,
        categories: next.categories,
        budgets: next.budgets,
      }, { merge: true });
    }
  }, []);

  const addExpense = useCallback((expense) => {
    setState(prev => {
      const next = { ...prev, expenses: [...prev.expenses, { id: crypto.randomUUID(), ...expense }] };
      persistExpenses(next.expenses);
      return next;
    });
  }, [persistExpenses]);

  const updateExpense = useCallback((id, patch) => {
    setState(prev => {
      const expenses = prev.expenses.map(e => (e.id === id ? { ...e, ...patch } : e));
      const next = { ...prev, expenses };
      persistExpenses(expenses);
      return next;
    });
  }, [persistExpenses]);

  const deleteExpense = useCallback((id) => {
    setState(prev => {
      const expenses = prev.expenses.filter(e => e.id !== id);
      const next = { ...prev, expenses };
      persistExpenses(expenses);
      return next;
    });
  }, [persistExpenses]);

  const addCategory = useCallback((name) => {
    setState(prev => {
      const categories = [...prev.categories, name];
      const next = { ...prev, categories };
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);

  const removeCategory = useCallback((name) => {
    setState(prev => {
      const categories = prev.categories.filter(c => c !== name);
      const budgets = { ...prev.budgets };
      delete budgets[name];
      const next = { ...prev, categories, budgets };
      persistProfile(next);
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
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);

  const setCurrency = useCallback((currency) => {
    setState(prev => {
      const settings = { ...prev.settings, currency };
      const next = { ...prev, settings };
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);

  const setThemePreference = useCallback((theme) => {
    setState(prev => {
      const settings = { ...prev.settings, theme };
      const next = { ...prev, settings };
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);

  return { state, loading, addExpense, updateExpense, deleteExpense, addCategory, removeCategory, setBudget, setCurrency, setThemePreference };
}
