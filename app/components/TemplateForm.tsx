'use client';

import { useState, useEffect } from 'react';

interface TemplateCategory {
  name: string;
  description: string;
  subCategories: TemplateSubCategory[];
}

interface TemplateSubCategory {
  name: string;
  description: string;
  coverageRules: {
    insuranceType: 'basic' | 'supplementary';
    percentage: number | null;
    maxAmount: number | null;
    description: string;
  }[];
  budgets: {
    year: number;
    amount: number;
  }[];
}

interface TemplateFormProps {
  template?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setDescription(template.description || '');
      setIsActive(template.isActive ?? true);
      setCategories(
        template.templateCategories?.map((cat: any) => ({
          name: cat.name,
          description: cat.description || '',
          subCategories: cat.templateSubCategories?.map((subCat: any) => ({
            name: subCat.name,
            description: subCat.description || '',
            coverageRules: subCat.templateCoverageRules?.map((rule: any) => ({
              insuranceType: rule.insuranceType,
              percentage: rule.percentage ?? null,
              maxAmount: rule.maxAmount ?? null,
              description: rule.description || '',
            })) || [],
            budgets: subCat.templateBudgets?.map((budget: any) => ({
              year: budget.year,
              amount: budget.amount,
            })) || [],
          })) || [],
        })) || []
      );
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
      setCategories([]);
    }
  }, [template]);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addCategory = () => {
    setCategories([...categories, { name: '', description: '', subCategories: [] }]);
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const updated = [...categories];
    (updated[index] as any)[field] = value;
    setCategories(updated);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const addSubCategory = (categoryIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].subCategories.push({
      name: '',
      description: '',
      coverageRules: [],
      budgets: [],
    });
    setCategories(updated);
  };

  const updateSubCategory = (
    categoryIndex: number,
    subCategoryIndex: number,
    field: string,
    value: string
  ) => {
    const updated = [...categories];
    (updated[categoryIndex].subCategories[subCategoryIndex] as any)[field] = value;
    setCategories(updated);
  };

  const removeSubCategory = (categoryIndex: number, subCategoryIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].subCategories = updated[categoryIndex].subCategories.filter(
      (_, i) => i !== subCategoryIndex
    );
    setCategories(updated);
  };

  const addCoverageRule = (categoryIndex: number, subCategoryIndex: number, type: 'basic' | 'supplementary') => {
    const updated = [...categories];
    const existing = updated[categoryIndex].subCategories[subCategoryIndex].coverageRules.find(
      (r) => r.insuranceType === type
    );
    if (!existing) {
      updated[categoryIndex].subCategories[subCategoryIndex].coverageRules.push({
        insuranceType: type,
        percentage: null,
        maxAmount: null,
        description: '',
      });
      setCategories(updated);
    }
  };

  const updateCoverageRule = (
    categoryIndex: number,
    subCategoryIndex: number,
    type: 'basic' | 'supplementary',
    field: string,
    value: number | string | null
  ) => {
    const updated = [...categories];
    const rule = updated[categoryIndex].subCategories[subCategoryIndex].coverageRules.find(
      (r) => r.insuranceType === type
    );
    if (rule) {
      (rule as any)[field] = value;
      setCategories(updated);
    }
  };

  const removeCoverageRule = (categoryIndex: number, subCategoryIndex: number, type: 'basic' | 'supplementary') => {
    const updated = [...categories];
    updated[categoryIndex].subCategories[subCategoryIndex].coverageRules = updated[
      categoryIndex
    ].subCategories[subCategoryIndex].coverageRules.filter((r) => r.insuranceType !== type);
    setCategories(updated);
  };

  const addBudget = (categoryIndex: number, subCategoryIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].subCategories[subCategoryIndex].budgets.push({
      year: 0,
      amount: 0,
    });
    setCategories(updated);
  };

  const updateBudget = (
    categoryIndex: number,
    subCategoryIndex: number,
    budgetIndex: number,
    field: string,
    value: number
  ) => {
    const updated = [...categories];
    (updated[categoryIndex].subCategories[subCategoryIndex].budgets[budgetIndex] as any)[field] = value;
    setCategories(updated);
  };

  const removeBudget = (categoryIndex: number, subCategoryIndex: number, budgetIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].subCategories[subCategoryIndex].budgets = updated[
      categoryIndex
    ].subCategories[subCategoryIndex].budgets.filter((_, i) => i !== budgetIndex);
    setCategories(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Bitte gib einen Template-Namen ein');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name,
        description,
        isActive,
        categories,
      });
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#2D3436] font-inter">
            Template-Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all"
            placeholder="z.B. Sanitas Vital Premium"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-[#2D3436] font-inter">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all"
            placeholder="Beschreibung des Templates..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-[#5844AC] border-[#2D3436]/20 rounded focus:ring-[#5844AC]/30"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[#2D3436] font-inter">
            Template ist aktiv
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#2D3436] font-poppins">Kategorien</h3>
          <button
            type="button"
            onClick={addCategory}
            className="px-4 py-2 bg-[#8E7CE8] text-white rounded-xl font-medium hover:bg-[#8E7CE8]/90 transition-all font-inter"
          >
            + Kategorie hinzufügen
          </button>
        </div>

        {categories.map((category, catIndex) => (
          <div key={catIndex} className="p-4 border-2 border-[#2D3436]/10 rounded-xl bg-[#F9FAFC]">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategory(catIndex, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20"
                  placeholder="Kategorie-Name"
                />
                <input
                  type="text"
                  value={category.description}
                  onChange={(e) => updateCategory(catIndex, 'description', e.target.value)}
                  className="w-full px-4 py-2 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20"
                  placeholder="Beschreibung (optional)"
                />
              </div>
              <button
                type="button"
                onClick={() => removeCategory(catIndex)}
                className="ml-3 px-3 py-2 text-[#FF8080] hover:bg-[#FF8080]/10 rounded-xl font-inter transition-all"
              >
                Löschen
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-[#2D3436] font-poppins">Unterkategorien</h4>
                <button
                  type="button"
                  onClick={() => addSubCategory(catIndex)}
                  className="px-3 py-1.5 bg-[#8E7CE8] text-white rounded-lg text-sm font-medium hover:bg-[#8E7CE8]/90 transition-all font-inter"
                >
                  + Unterkategorie
                </button>
              </div>

              {category.subCategories.map((subCat, subIndex) => {
                const subCatKey = `${catIndex}-${subIndex}`;
                return (
                  <div key={subIndex} className="p-3 border border-[#2D3436]/10 rounded-xl bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={subCat.name}
                          onChange={(e) => updateSubCategory(catIndex, subIndex, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-[#2D3436]/10 rounded-lg bg-white text-[#2D3436] font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20"
                          placeholder="Unterkategorie-Name"
                        />
                        <input
                          type="text"
                          value={subCat.description}
                          onChange={(e) => updateSubCategory(catIndex, subIndex, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-[#2D3436]/10 rounded-lg bg-white text-[#2D3436] font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20"
                          placeholder="Beschreibung (optional)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubCategory(catIndex, subIndex)}
                        className="ml-2 px-2 py-1 text-[#FF8080] hover:bg-[#FF8080]/10 rounded-lg text-sm font-inter transition-all"
                      >
                        ×
                      </button>
                    </div>

                    {/* Coverage Rules */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[#2D3436]/60 font-inter">Deckungsregeln</span>
                        <div className="flex gap-2">
                          {!subCat.coverageRules.find((r) => r.insuranceType === 'basic') && (
                            <button
                              type="button"
                              onClick={() => addCoverageRule(catIndex, subIndex, 'basic')}
                              className="px-2 py-1 text-xs bg-[#5844AC] text-white rounded-lg hover:bg-[#5844AC]/90 font-inter"
                            >
                              + Grundversicherung
                            </button>
                          )}
                          {!subCat.coverageRules.find((r) => r.insuranceType === 'supplementary') && (
                            <button
                              type="button"
                              onClick={() => addCoverageRule(catIndex, subIndex, 'supplementary')}
                              className="px-2 py-1 text-xs bg-[#00C896] text-white rounded-lg hover:bg-[#00C896]/90 font-inter"
                            >
                              + Zusatzversicherung
                            </button>
                          )}
                        </div>
                      </div>

                      {subCat.coverageRules.map((rule, ruleIndex) => (
                        <div key={ruleIndex} className="p-2 bg-[#F9FAFC] rounded-lg border border-[#2D3436]/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-[#2D3436] font-inter">
                              {rule.insuranceType === 'basic' ? 'Grundversicherung' : 'Zusatzversicherung'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCoverageRule(catIndex, subIndex, rule.insuranceType)}
                              className="text-xs text-[#FF8080] hover:text-[#FF8080]/80"
                            >
                              ×
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-[#2D3436]/60 font-inter">Prozent (%)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={rule.percentage || ''}
                                onChange={(e) =>
                                  updateCoverageRule(
                                    catIndex,
                                    subIndex,
                                    rule.insuranceType,
                                    'percentage',
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-[#2D3436]/10 rounded bg-white text-[#2D3436] font-inter"
                                placeholder="z.B. 50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#2D3436]/60 font-inter">Max. Betrag (CHF)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={rule.maxAmount || ''}
                                onChange={(e) =>
                                  updateCoverageRule(
                                    catIndex,
                                    subIndex,
                                    rule.insuranceType,
                                    'maxAmount',
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-[#2D3436]/10 rounded bg-white text-[#2D3436] font-inter"
                                placeholder="z.B. 500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Budgets */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[#2D3436]/60 font-inter">Budgets</span>
                        <button
                          type="button"
                          onClick={() => addBudget(catIndex, subIndex)}
                          className="px-2 py-1 text-xs bg-[#5844AC] text-white rounded-lg hover:bg-[#5844AC]/90 font-inter"
                        >
                          + Budget
                        </button>
                      </div>

                      {subCat.budgets.map((budget, budgetIndex) => (
                        <div key={budgetIndex} className="p-2 bg-[#F9FAFC] rounded-lg border border-[#2D3436]/5">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-[#2D3436]/60 font-inter">Jahr (0 = alle Jahre)</label>
                                <input
                                  type="number"
                                  value={budget.year}
                                  onChange={(e) =>
                                    updateBudget(catIndex, subIndex, budgetIndex, 'year', parseInt(e.target.value) || 0)
                                  }
                                  className="w-full px-2 py-1 text-xs border border-[#2D3436]/10 rounded bg-white text-[#2D3436] font-inter"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-[#2D3436]/60 font-inter">Betrag (CHF)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={budget.amount}
                                  onChange={(e) =>
                                    updateBudget(catIndex, subIndex, budgetIndex, 'amount', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full px-2 py-1 text-xs border border-[#2D3436]/10 rounded bg-white text-[#2D3436] font-inter"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBudget(catIndex, subIndex, budgetIndex)}
                              className="px-2 py-1 text-xs text-[#FF8080] hover:bg-[#FF8080]/10 rounded"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#2D3436]/10">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#5844AC] text-white rounded-xl font-semibold hover:bg-[#5844AC]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-poppins"
        >
          {saving ? 'Wird gespeichert...' : template ? 'Template aktualisieren' : 'Template erstellen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-3 bg-[#2D3436]/10 text-[#2D3436] rounded-xl font-medium hover:bg-[#2D3436]/20 disabled:opacity-50 transition-all font-inter"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

