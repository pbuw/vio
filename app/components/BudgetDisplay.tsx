'use client';

import { useState, useEffect } from 'react';

interface BudgetSummary {
  id: string;
  subCategoryId: string;
  subCategoryName: string;
  categoryId?: string;
  categoryName: string;
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

interface BudgetDisplayProps {
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
}

export default function BudgetDisplay({ onCategoryClick }: BudgetDisplayProps) {
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchDashboard();
    
    // Listen for expense added/deleted/updated events
    const handleExpenseAdded = () => {
      fetchDashboard();
    };
    const handleExpenseDeleted = () => {
      fetchDashboard();
    };
    const handleExpenseUpdated = () => {
      fetchDashboard();
    };
    window.addEventListener('expenseAdded', handleExpenseAdded);
    window.addEventListener('expenseDeleted', handleExpenseDeleted);
    window.addEventListener('expenseUpdated', handleExpenseUpdated);
    
    return () => {
      window.removeEventListener('expenseAdded', handleExpenseAdded);
      window.removeEventListener('expenseDeleted', handleExpenseDeleted);
      window.removeEventListener('expenseUpdated', handleExpenseUpdated);
    };
  }, [year]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?year=${year}`);
      const data = await response.json();
      setBudgets(data.budgetSummary || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetColor = (percentageUsed: number) => {
    if (percentageUsed >= 100) return 'bg-[#FF8080]';
    if (percentageUsed >= 75) return 'bg-[#FF8080]/60';
    return 'bg-[#00C896]';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
        <p className="text-[#2D3436]/60 font-inter">Budgets werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#2D3436] font-poppins">Budget-Übersicht</h2>
        <div className="relative">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-[#5844AC]"
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

      {budgets.length === 0 ? (
        <p className="text-[#2D3436]/60 font-inter">Noch keine Budgets für {year} eingerichtet. Lege deine ersten Budgets in den Kategorien an.</p>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              onClick={() => {
                if (onCategoryClick && budget.categoryId) {
                  onCategoryClick(budget.categoryId, budget.categoryName);
                }
              }}
              className={`border border-[#2D3436]/10 rounded-2xl p-5 bg-[#F9FAFC] transition-all ${
                onCategoryClick && budget.categoryId
                  ? 'cursor-pointer hover:border-[#5844AC]/30 hover:bg-[#5844AC]/5 hover:shadow-md'
                  : ''
              }`}
              title={onCategoryClick && budget.categoryId ? `Ausgaben für ${budget.categoryName} anzeigen` : undefined}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-[#2D3436] font-poppins">
                    {budget.categoryName}
                  </h3>
                  <p className="text-sm text-[#2D3436]/60 font-inter">
                    {budget.subCategoryName}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#2D3436]/60 font-inter">Verbleibend</div>
                  <div
                    className={`text-lg font-semibold font-poppins ${
                      budget.remainingAmount >= 0
                        ? 'text-[#00C896]'
                        : 'text-[#FF8080]'
                    }`}
                  >
                    CHF {budget.remainingAmount.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-2 font-inter">
                  <span className="text-[#2D3436]/60">
                    Verwendet: CHF {budget.usedAmount.toFixed(2)} / CHF {budget.totalBudget.toFixed(2)}
                  </span>
                  <span className="text-[#2D3436]/60 font-medium">
                    {budget.percentageUsed.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#2D3436]/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getBudgetColor(budget.percentageUsed)}`}
                    style={{ width: `${Math.min(100, budget.percentageUsed)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

