'use client';

import { useState, useEffect } from 'react';
import TemplateSelector from './TemplateSelector';

interface Category {
  id: string;
  name: string;
  description: string | null;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
}

interface CoverageRule {
  id: string;
  insuranceType: 'basic' | 'supplementary';
  percentage: number | null;
  maxAmount: number | null;
  description: string | null;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);
  const [coverageRules, setCoverageRules] = useState<Record<string, CoverageRule[]>>({});
  const [budgets, setBudgets] = useState<Record<string, { year: number; amount: number }>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
      
      // Fetch coverage rules for all subcategories
      for (const category of data) {
        for (const subCategory of category.subCategories) {
          fetchCoverageRules(subCategory.id);
          fetchBudget(subCategory.id);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCoverageRules = async (subCategoryId: string) => {
    try {
      const response = await fetch(`/api/coverage-rules?subCategoryId=${subCategoryId}`);
      const data = await response.json();
      setCoverageRules((prev) => ({ ...prev, [subCategoryId]: data }));
    } catch (error) {
      console.error('Error fetching coverage rules:', error);
    }
  };

  const fetchBudget = async (subCategoryId: string) => {
    try {
      const response = await fetch(`/api/budgets?subCategoryId=${subCategoryId}&year=${new Date().getFullYear()}`);
      const data = await response.json();
      if (data.length > 0) {
        setBudgets((prev) => ({
          ...prev,
          [subCategoryId]: { year: data[0].year, amount: data[0].amount },
        }));
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (response.ok) {
        setNewCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCategoryName.trim() || !selectedCategoryId) return;

    try {
      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubCategoryName,
          categoryId: selectedCategoryId,
        }),
      });

      if (response.ok) {
        setNewSubCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Error adding subcategory:', error);
    }
  };

  const handleSaveCoverageRule = async (
    subCategoryId: string,
    insuranceType: 'basic' | 'supplementary',
    percentage: number | null,
    maxAmount: number | null
  ) => {
    const response = await fetch('/api/coverage-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subCategoryId,
        insuranceType,
        percentage,
        maxAmount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save coverage rule');
    }

    await fetchCoverageRules(subCategoryId);
  };

  const handleSaveBudget = async (subCategoryId: string, amount: number) => {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subCategoryId,
        year: new Date().getFullYear(),
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save budget');
    }

    await fetchBudget(subCategoryId);
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <TemplateSelector onTemplateApplied={fetchCategories} />

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
        <h2 className="text-2xl font-semibold mb-6 text-[#2D3436] font-poppins">
          Kategorien verwalten
        </h2>

        {/* Add Category */}
      <form onSubmit={handleAddCategory} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Neue Kategorie"
            className="flex-1 px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#5844AC] text-white rounded-xl hover:bg-[#5844AC]/90 transition-all shadow-sm font-poppins font-semibold"
          >
            Kategorie hinzufügen
          </button>
        </div>
      </form>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="border border-[#2D3436]/10 rounded-2xl p-5 bg-[#F9FAFC]">
            <h3 className="font-semibold text-lg mb-4 text-[#2D3436] font-poppins">
              {category.name}
            </h3>

            {/* Add Subcategory */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSelectedCategoryId(category.id);
                handleAddSubCategory(e);
              }}
              className="mb-4"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={selectedCategoryId === category.id ? newSubCategoryName : ''}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  placeholder="Neue Unterkategorie"
                  className="flex-1 px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#8E7CE8] text-white rounded-xl hover:bg-[#8E7CE8]/90 transition-all shadow-sm font-poppins font-semibold"
                >
                  Unterkategorie hinzufügen
                </button>
              </div>
            </form>

            {/* Subcategories */}
            <div className="space-y-3">
              {category.subCategories.map((subCategory) => (
                <div
                  key={subCategory.id}
                  className="border border-[#2D3436]/10 rounded-xl p-4 bg-white"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#2D3436] font-inter">
                      {subCategory.name}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedSubCategory(
                          expandedSubCategory === subCategory.id ? null : subCategory.id
                        )
                      }
                      className="text-sm text-[#5844AC] hover:text-[#5844AC]/80 font-inter font-medium transition-colors"
                    >
                      {expandedSubCategory === subCategory.id ? 'Ausblenden' : 'Konfigurieren'}
                    </button>
                  </div>

                  {expandedSubCategory === subCategory.id && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-[#2D3436]/10">
                      {/* Coverage Rules */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-[#2D3436] font-poppins">
                          Deckungsregeln
                        </h4>
                        {(['basic', 'supplementary'] as const).map((type) => {
                          const rule =
                            coverageRules[subCategory.id]?.find((r) => r.insuranceType === type) ||
                            null;
                          return (
                            <CoverageRuleEditor
                              key={type}
                              subCategoryId={subCategory.id}
                              insuranceType={type}
                              rule={rule}
                              onSave={handleSaveCoverageRule}
                            />
                          );
                        })}
                      </div>

                      {/* Budget */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-[#2D3436] font-poppins">
                          Budget ({new Date().getFullYear()})
                        </h4>
                        <BudgetEditor
                          subCategoryId={subCategory.id}
                          budget={budgets[subCategory.id]}
                          onSave={handleSaveBudget}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function CoverageRuleEditor({
  subCategoryId,
  insuranceType,
  rule,
  onSave,
}: {
  subCategoryId: string;
  insuranceType: 'basic' | 'supplementary';
  rule: CoverageRule | null;
  onSave: (
    subCategoryId: string,
    insuranceType: 'basic' | 'supplementary',
    percentage: number | null,
    maxAmount: number | null
  ) => Promise<void>;
}) {
  const [percentage, setPercentage] = useState<string>(
    rule?.percentage?.toString() || ''
  );
  const [maxAmount, setMaxAmount] = useState<string>(
    rule?.maxAmount?.toString() || ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPercentage(rule?.percentage?.toString() || '');
    setMaxAmount(rule?.maxAmount?.toString() || '');
  }, [rule?.percentage, rule?.maxAmount]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(
        subCategoryId,
        insuranceType,
        percentage ? parseFloat(percentage) : null,
        maxAmount ? parseFloat(maxAmount) : null
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving coverage rule:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F9FAFC] rounded-xl p-4 mb-3 border border-[#2D3436]/5">
      <div className="text-sm font-semibold mb-3 text-[#2D3436] font-poppins">
        {insuranceType === 'basic' ? 'Grundversicherung' : 'Zusatzversicherung'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#2D3436]/60 mb-1.5 block font-inter">Prozent (%)</label>
          <input
            type="number"
            step="0.01"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="z.B. 50"
            className="w-full px-3 py-2 text-sm border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-[#2D3436]/60 mb-1.5 block font-inter">Max. Betrag (CHF)</label>
          <input
            type="number"
            step="0.01"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="z.B. 500"
            className="w-full px-3 py-2 text-sm border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-3 px-4 py-2 text-sm rounded-xl transition-all font-inter font-medium ${
          saved
            ? 'bg-[#00C896] text-white'
            : 'bg-[#5844AC] text-white hover:bg-[#5844AC]/90'
        } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
      >
        {saving ? 'Wird gespeichert...' : saved ? '✓ Alles gespeichert' : 'Speichern'}
      </button>
    </div>
  );
}

function BudgetEditor({
  subCategoryId,
  budget,
  onSave,
}: {
  subCategoryId: string;
  budget?: { year: number; amount: number };
  onSave: (subCategoryId: string, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<string>(budget?.amount.toString() || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (budget?.amount) {
      setAmount(budget.amount.toString());
    }
  }, [budget?.amount]);

  const handleSave = async () => {
    if (!amount) return;
    
    setSaving(true);
    setSaved(false);
    try {
      await onSave(subCategoryId, parseFloat(amount));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F9FAFC] rounded-xl p-4 border border-[#2D3436]/5">
      <div className="flex gap-3">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Budgetbetrag (CHF)"
          className="flex-1 px-4 py-3 text-sm border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
        />
        <button
          onClick={handleSave}
          disabled={saving || !amount}
          className={`px-6 py-3 text-sm rounded-xl transition-all font-inter font-medium ${
            saved
              ? 'bg-[#00C896] text-white'
              : 'bg-[#5844AC] text-white hover:bg-[#5844AC]/90'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
        >
          {saving ? 'Wird gespeichert...' : saved ? '✓ Alles gespeichert' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

