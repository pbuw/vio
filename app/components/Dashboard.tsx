'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import BudgetDisplay from './BudgetDisplay';
import CategoryManager from './CategoryManager';
import TemplateManager from './TemplateManager';

interface DashboardData {
  year: number;
  totals: {
    totalExpenses: number;
    totalBasicCoverage: number;
    totalSupplementaryCoverage: number;
    totalUserPays: number;
  };
  expensesByCategory: Record<string, any>;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'categories' | 'templates'>('overview');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchDashboard();
    
    // Listen for expense added/updated/deleted events
    const handleExpenseAdded = () => {
      fetchDashboard();
    };
    const handleExpenseUpdated = () => {
      fetchDashboard();
    };
    const handleExpenseDeleted = () => {
      fetchDashboard();
    };
    window.addEventListener('expenseAdded', handleExpenseAdded);
    window.addEventListener('expenseUpdated', handleExpenseUpdated);
    window.addEventListener('expenseDeleted', handleExpenseDeleted);
    
    return () => {
      window.removeEventListener('expenseAdded', handleExpenseAdded);
      window.removeEventListener('expenseUpdated', handleExpenseUpdated);
      window.removeEventListener('expenseDeleted', handleExpenseDeleted);
    };
  }, [year]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?year=${year}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F9FAFC] flex items-center justify-center">
        <p className="text-[#2D3436]/60 font-inter">Wird geladen...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-[#2D3436] mb-2 font-poppins">
                vio
              </h1>
              <p className="text-[#2D3436]/70 font-inter">
                Deine Zusatzversicherung. Einfach genutzt.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#2D3436]/60 font-inter">
                {session.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-white text-[#2D3436] rounded-xl hover:bg-[#F9FAFC] border border-[#2D3436]/10 transition-colors font-inter font-medium shadow-sm"
              >
                Abmelden
              </button>
            </div>
          </div>
        </header>

        {/* Year Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#2D3436] mr-2 font-inter">
            Jahr:
          </label>
          <div className="inline-block relative">
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

        {/* Tabs */}
        <div className="mb-6 border-b border-[#2D3436]/10">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setActiveTab('overview');
                setShowExpenseForm(false);
                setEditingExpense(null);
                setSelectedCategoryId(null);
                setSelectedCategoryName(null);
              }}
              className={`px-4 py-2 font-medium font-inter transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[#5844AC] text-[#5844AC]'
                  : 'text-[#2D3436]/60 hover:text-[#2D3436]'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => {
                setActiveTab('expenses');
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
              className={`px-4 py-2 font-medium font-inter transition-colors ${
                activeTab === 'expenses'
                  ? 'border-b-2 border-[#5844AC] text-[#5844AC]'
                  : 'text-[#2D3436]/60 hover:text-[#2D3436]'
              }`}
            >
              Ausgaben
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
              className={`px-4 py-2 font-medium font-inter transition-colors ${
                activeTab === 'categories'
                  ? 'border-b-2 border-[#5844AC] text-[#5844AC]'
                  : 'text-[#2D3436]/60 hover:text-[#2D3436]'
              }`}
            >
              Kategorien
            </button>
            {session?.user && (session.user as any).role === 'superadmin' && (
              <button
                onClick={() => {
                  setActiveTab('templates');
                  setShowExpenseForm(false);
                  setEditingExpense(null);
                }}
                className={`px-4 py-2 font-medium font-inter transition-colors ${
                  activeTab === 'templates'
                    ? 'border-b-2 border-[#5844AC] text-[#5844AC]'
                    : 'text-[#2D3436]/60 hover:text-[#2D3436]'
                }`}
              >
                Templates
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {loading ? (
              <p className="text-[#2D3436]/60 font-inter">Wird geladen...</p>
            ) : dashboardData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
                  <h3 className="text-sm font-medium text-[#2D3436]/60 mb-2 font-inter">
                    Gesamtausgaben
                  </h3>
                  <p className="text-2xl font-bold text-[#2D3436] font-poppins">
                    CHF {dashboardData.totals.totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
                  <h3 className="text-sm font-medium text-[#2D3436]/60 mb-2 font-inter">
                    Grundversicherung
                  </h3>
                  <p className="text-2xl font-bold text-[#5844AC] font-poppins">
                    CHF {dashboardData.totals.totalBasicCoverage.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
                  <h3 className="text-sm font-medium text-[#2D3436]/60 mb-2 font-inter">
                    Zusatzversicherung
                  </h3>
                  <p className="text-2xl font-bold text-[#00C896] font-poppins">
                    CHF {dashboardData.totals.totalSupplementaryCoverage.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
                  <h3 className="text-sm font-medium text-[#2D3436]/60 mb-2 font-inter">
                    Dein Anteil
                  </h3>
                  <p className="text-2xl font-bold text-[#FF8080] font-poppins">
                    CHF {dashboardData.totals.totalUserPays.toFixed(2)}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Budget Display - More Prominent */}
            <BudgetDisplay
              onCategoryClick={(categoryId, categoryName) => {
                setSelectedCategoryId(categoryId);
                setSelectedCategoryName(categoryName);
                setActiveTab('expenses');
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
            />

            {/* Add Expense Button and Form */}
            <div className="space-y-4">
              {!showExpenseForm && !editingExpense ? (
                <button
                  onClick={() => {
                    setShowExpenseForm(true);
                    setEditingExpense(null);
                  }}
                  className="w-full md:w-auto bg-[#5844AC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5844AC]/90 transition-all shadow-sm font-poppins"
                >
                  + Ausgabe hinzufügen
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#2D3436] font-poppins">
                      {editingExpense ? 'Ausgabe bearbeiten' : 'Ausgabe hinzufügen'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowExpenseForm(false);
                        setEditingExpense(null);
                      }}
                      className="px-4 py-2 text-sm text-[#2D3436]/60 hover:text-[#2D3436] font-inter transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                  <ExpenseForm
                    onClose={() => {
                      setShowExpenseForm(false);
                      setEditingExpense(null);
                    }}
                    expense={editingExpense}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Add Expense Button and Form */}
            <div className="space-y-4">
              {!showExpenseForm && !editingExpense ? (
                <button
                  onClick={() => {
                    setShowExpenseForm(true);
                    setEditingExpense(null);
                  }}
                  className="w-full md:w-auto bg-[#5844AC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5844AC]/90 transition-all shadow-sm font-poppins"
                >
                  + Ausgabe hinzufügen
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#2D3436] font-poppins">
                      {editingExpense ? 'Ausgabe bearbeiten' : 'Ausgabe hinzufügen'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowExpenseForm(false);
                        setEditingExpense(null);
                      }}
                      className="px-4 py-2 text-sm text-[#2D3436]/60 hover:text-[#2D3436] font-inter transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                  <ExpenseForm
                    onClose={() => {
                      setShowExpenseForm(false);
                      setEditingExpense(null);
                    }}
                    expense={editingExpense}
                  />
                </div>
              )}
            </div>
            <ExpenseList
              onEdit={(expense) => {
                setEditingExpense(expense);
                setShowExpenseForm(true);
              }}
              categoryId={selectedCategoryId}
              categoryName={selectedCategoryName}
              onClearFilter={() => {
                setSelectedCategoryId(null);
                setSelectedCategoryName(null);
              }}
            />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <CategoryManager />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <TemplateManager />
          </div>
        )}
      </div>
    </div>
  );
}

