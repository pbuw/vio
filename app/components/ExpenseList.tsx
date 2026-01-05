'use client';

import { useState, useEffect } from 'react';

interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  basicCoverage: number;
  supplementaryCoverage: number;
  userPays: number;
  subCategoryId: string;
  subCategory: {
    id: string;
    name: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
  };
  documents?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    documentType: string;
    createdAt: string;
  }>;
}

interface ExpenseListProps {
  onEdit?: (expense: Expense) => void;
  categoryId?: string | null;
  categoryName?: string | null;
  onClearFilter?: () => void;
}

export default function ExpenseList({ onEdit, categoryId, categoryName, onClearFilter }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchExpenses();
    
    // Listen for expense added/updated/deleted events
    const handleExpenseAdded = () => {
      fetchExpenses();
    };
    const handleExpenseUpdated = () => {
      fetchExpenses();
    };
    const handleExpenseDeleted = () => {
      fetchExpenses();
    };
    window.addEventListener('expenseAdded', handleExpenseAdded);
    window.addEventListener('expenseUpdated', handleExpenseUpdated);
    window.addEventListener('expenseDeleted', handleExpenseDeleted);
    
    return () => {
      window.removeEventListener('expenseAdded', handleExpenseAdded);
      window.removeEventListener('expenseUpdated', handleExpenseUpdated);
      window.removeEventListener('expenseDeleted', handleExpenseDeleted);
    };
  }, [year, categoryId]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?year=${year}`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Möchtest du diese Ausgabe wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the expense list
        fetchExpenses();
        // Trigger refresh in other components
        window.dispatchEvent(new Event('expenseDeleted'));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Die Ausgabe konnte nicht gelöscht werden. Bitte versuche es noch einmal.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
        <p className="text-[#2D3436]/60 font-inter">Ausgaben werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#2D3436] font-poppins">Ausgaben</h2>
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

      {categoryName && (
        <div className="mb-4 flex items-center gap-3 bg-[#5844AC]/10 border border-[#5844AC]/20 rounded-xl px-4 py-3">
          <span className="text-sm text-[#2D3436]/70 font-inter">
            Gefiltert nach:
          </span>
          <span className="text-sm font-semibold text-[#5844AC] font-poppins">
            {categoryName}
          </span>
          {onClearFilter && (
            <button
              onClick={onClearFilter}
              className="ml-auto px-3 py-1.5 text-sm text-[#2D3436]/60 hover:text-[#2D3436] hover:bg-white/50 rounded-lg transition-colors font-inter"
              title="Filter entfernen"
            >
              Filter entfernen
            </button>
          )}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="text-[#2D3436]/60 font-inter">
          {categoryName
            ? `Noch keine Ausgaben für ${categoryName} in ${year}.`
            : `Noch keine Ausgaben für ${year}. Füge deine erste Ausgabe hinzu, um den Überblick zu behalten.`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-inter">
            <thead>
              <tr className="border-b border-[#2D3436]/10">
                <th className="text-left py-3 px-3 text-[#2D3436]/60 font-medium">Datum</th>
                <th className="text-left py-3 px-3 text-[#2D3436]/60 font-medium">Kategorie</th>
                <th className="text-left py-3 px-3 text-[#2D3436]/60 font-medium">Beschreibung</th>
                <th className="text-right py-3 px-3 text-[#2D3436]/60 font-medium">Betrag</th>
                <th className="text-right py-3 px-3 text-[#2D3436]/60 font-medium">Grundversicherung</th>
                <th className="text-right py-3 px-3 text-[#2D3436]/60 font-medium">Zusatzversicherung</th>
                <th className="text-right py-3 px-3 text-[#2D3436]/60 font-medium">Dein Anteil</th>
                <th className="text-center py-3 px-3 text-[#2D3436]/60 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-[#2D3436]/5 hover:bg-[#F9FAFC] transition-colors"
                >
                  <td className="py-3 px-3 text-[#2D3436]/70">
                    {formatDate(expense.date)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-[#2D3436] font-medium">{expense.subCategory.category.name}</div>
                    <div className="text-xs text-[#2D3436]/50">
                      {expense.subCategory.name}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#2D3436]/70">
                    <div className="flex items-center gap-2">
                      <span>{expense.description || '-'}</span>
                      {expense.documents && expense.documents.length > 0 && (
                        <div className="flex items-center gap-1" title={`${expense.documents.length} Dokument${expense.documents.length > 1 ? 'e' : ''}`}>
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-xs text-[#5844AC] font-medium">
                            {expense.documents.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#2D3436] font-poppins">
                    CHF {expense.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#5844AC]">
                    CHF {expense.basicCoverage.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#00C896] font-semibold">
                    CHF {expense.supplementaryCoverage.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#FF8080] font-semibold">
                    CHF {expense.userPays.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex gap-2 justify-center">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(expense)}
                          className="px-3 py-1.5 text-sm text-[#5844AC] hover:bg-[#5844AC]/10 rounded-xl transition-colors font-inter"
                          title="Ausgabe bearbeiten"
                        >
                          Bearbeiten
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="px-3 py-1.5 text-sm text-[#FF8080] hover:bg-[#FF8080]/10 rounded-xl transition-colors font-inter"
                        title="Ausgabe löschen"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2D3436]/10 font-semibold">
                <td colSpan={4} className="py-3 px-3 text-[#2D3436] font-poppins">
                  Gesamt
                </td>
                <td className="py-3 px-3 text-right text-[#2D3436] font-poppins">
                  CHF {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-[#5844AC]">
                  CHF {expenses.reduce((sum, e) => sum + e.basicCoverage, 0).toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-[#00C896] font-semibold">
                  CHF {expenses.reduce((sum, e) => sum + e.supplementaryCoverage, 0).toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-[#FF8080] font-semibold">
                  CHF {expenses.reduce((sum, e) => sum + e.userPays, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

