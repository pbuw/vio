'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CoverageCalculation {
  basicCoverage: number;
  supplementaryCoverage: number;
  userPays: number;
}

interface ExpenseFormProps {
  onClose?: () => void;
}

export default function ExpenseForm({ onClose }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calculation, setCalculation] = useState<CoverageCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedSubCategoryId && amount) {
      calculateCoverage();
    } else {
      setCalculation(null);
    }
  }, [selectedSubCategoryId, amount]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const calculateCoverage = async () => {
    if (!selectedSubCategoryId || !amount || parseFloat(amount) <= 0) {
      setCalculation(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/expenses/calculate?amount=${amount}&subCategoryId=${selectedSubCategoryId}`
      );
      const data = await response.json();
      setCalculation(data);
    } catch (error) {
      console.error('Error calculating coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubCategoryId || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          date,
          description,
          subCategoryId: selectedSubCategoryId,
        }),
      });

      if (response.ok) {
        // Reset form
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedCategoryId('');
        setSelectedSubCategoryId('');
        setCalculation(null);
        // Trigger refresh in parent
        window.dispatchEvent(new Event('expenseAdded'));
        // Close form if onClose callback provided
        if (onClose) {
          onClose();
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating expense:', error);
        alert('Ups, die Ausgabe konnte nicht erstellt werden. Bitte versuche es noch einmal.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const availableSubCategories = selectedCategory?.subCategories || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
            Kategorie
          </label>
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubCategoryId('');
              }}
              className="w-full px-4 py-3.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20"
              required
            >
              <option value="" disabled className="text-[#2D3436]/40">
                Kategorie auswählen
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="text-[#2D3436]">
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg
                className="w-5 h-5 text-[#5844AC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
            Unterkategorie
          </label>
          <div className="relative">
            <select
              value={selectedSubCategoryId}
              onChange={(e) => setSelectedSubCategoryId(e.target.value)}
              className="w-full px-4 py-3.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2D3436]/10"
              required
              disabled={!selectedCategoryId}
            >
              <option value="" disabled className="text-[#2D3436]/40">
                {selectedCategoryId ? 'Unterkategorie auswählen' : 'Wähle zuerst eine Kategorie'}
              </option>
              {availableSubCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id} className="text-[#2D3436]">
                  {subCategory.name}
                </option>
              ))}
            </select>
            <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none ${!selectedCategoryId ? 'opacity-50' : ''}`}>
              <svg
                className="w-5 h-5 text-[#5844AC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {!selectedCategoryId && (
            <p className="mt-1.5 text-xs text-[#2D3436]/50 font-inter">
              Bitte wähle zuerst eine Kategorie aus
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
            Betrag (CHF)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
            Beschreibung (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
            placeholder="z.B. Massage"
          />
        </div>

        {calculation && (
          <div className="bg-[#F9FAFC] rounded-xl p-5 space-y-3 border border-[#2D3436]/5">
            <h3 className="font-semibold text-[#2D3436] font-poppins">Deine Deckung</h3>
            <div className="grid grid-cols-2 gap-3 text-sm font-inter">
              <div className="text-[#2D3436]/60">Grundversicherung:</div>
              <div className="font-semibold text-[#5844AC] font-poppins">
                CHF {calculation.basicCoverage.toFixed(2)}
              </div>
              <div className="text-[#2D3436]/60">Zusatzversicherung:</div>
              <div className="font-semibold text-[#00C896] font-poppins">
                CHF {calculation.supplementaryCoverage.toFixed(2)}
              </div>
              <div className="text-[#2D3436]/60">Dein Anteil:</div>
              <div className="font-semibold text-[#FF8080] font-poppins">
                CHF {calculation.userPays.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedSubCategoryId || !amount}
          className="w-full bg-[#5844AC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5844AC]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-poppins"
        >
          {submitting ? 'Wird gespeichert...' : 'Ausgabe hinzufügen'}
        </button>
      </form>
    </div>
  );
}

